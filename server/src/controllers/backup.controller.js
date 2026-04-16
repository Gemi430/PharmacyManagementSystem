import pool from '../config/db.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET all backups
export const getBackups = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.username as created_by_user
      FROM backups b
      LEFT JOIN users u ON b.created_by = u.id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE backup
export const createBackup = async (req, res) => {
  try {
    const { backup_type = 'full' } = req.body;
    const user_id = req.user?.id;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${backup_type}_${timestamp}.sql`;
    const backupDir = path.join(__dirname, '../../backups');

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, filename);

    // Get database connection details from environment or config
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5432;
    const dbName = process.env.DB_NAME || 'pharmacy_db';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || '';

    // Build pg_dump command
    let pgDumpCmd = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser}`;
    if (dbPassword) {
      pgDumpCmd = `PGPASSWORD=${dbPassword} ${pgDumpCmd}`;
    }
    pgDumpCmd += ` ${dbName} > "${filePath}"`;

    // Insert backup record
    const backupResult = await pool.query(
      `INSERT INTO backups (filename, backup_type, status, created_by)
       VALUES ($1, $2, 'in_progress', $3)
       RETURNING *`,
      [filename, backup_type, user_id]
    );

    // Execute backup
    try {
      await execAsync(pgDumpCmd, { timeout: 300000 }); // 5 minute timeout

      const fileSize = fs.statSync(filePath).size;

      await pool.query(
        `UPDATE backups
         SET status = 'completed', file_size = $1
         WHERE id = $2`,
        [fileSize, backupResult.rows[0].id]
      );

      res.json({ message: 'Backup created successfully', backup: backupResult.rows[0] });
    } catch (execError) {
      await pool.query(
        `UPDATE backups
         SET status = 'failed', error_message = $1
         WHERE id = $2`,
        [execError.message, backupResult.rows[0].id]
      );

      // Clean up partial file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw execError;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Backup failed: ' + error.message });
  }
};

// RESTORE backup
export const restoreBackup = async (req, res) => {
  try {
    const { backup_id } = req.params;

    // Get backup info
    const backupResult = await pool.query('SELECT * FROM backups WHERE id = $1', [backup_id]);

    if (backupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    const backup = backupResult.rows[0];

    if (backup.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot restore incomplete backup' });
    }

    const backupDir = path.join(__dirname, '../../backups');
    const filePath = path.join(backupDir, backup.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    // Get database connection details
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5432;
    const dbName = process.env.DB_NAME || 'pharmacy_db';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || '';

    // Build psql command
    let psqlCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName}`;
    if (dbPassword) {
      psqlCmd = `PGPASSWORD=${dbPassword} ${psqlCmd}`;
    }
    psqlCmd += ` -f "${filePath}"`;

    // Execute restore
    await execAsync(psqlCmd, { timeout: 600000 }); // 10 minute timeout

    res.json({ message: 'Backup restored successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Restore failed: ' + error.message });
  }
};

// DELETE backup
export const deleteBackup = async (req, res) => {
  try {
    const { id } = req.params;

    const backupResult = await pool.query('SELECT * FROM backups WHERE id = $1', [id]);

    if (backupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    const backup = backupResult.rows[0];

    // Delete file
    const backupDir = path.join(__dirname, '../../backups');
    const filePath = path.join(backupDir, backup.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record
    await pool.query('DELETE FROM backups WHERE id = $1', [id]);

    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DOWNLOAD backup
export const downloadBackup = async (req, res) => {
  try {
    const { id } = req.params;

    const backupResult = await pool.query('SELECT * FROM backups WHERE id = $1', [id]);

    if (backupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    const backup = backupResult.rows[0];
    const backupDir = path.join(__dirname, '../../backups');
    const filePath = path.join(backupDir, backup.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    res.download(filePath, backup.filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// AUTO cleanup old backups
export const cleanupOldBackups = async () => {
  try {
    const retentionDays = 30; // Default retention

    const result = await pool.query(
      `SELECT * FROM backups
       WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * $1
       AND status = 'completed'`,
      [retentionDays]
    );

    const backupDir = path.join(__dirname, '../../backups');

    for (const backup of result.rows) {
      const filePath = path.join(backupDir, backup.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await pool.query('DELETE FROM backups WHERE id = $1', [backup.id]);
    }

    console.log(`Cleaned up ${result.rows.length} old backups`);
  } catch (error) {
    console.error('Backup cleanup failed:', error);
  }
};