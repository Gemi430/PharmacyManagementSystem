import pool from '../config/db.js';

// GET audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const { user_id, action, entity_type, entity_id, start_date, end_date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT al.*, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      params.push(user_id);
      query += ` AND al.user_id = $${params.length}`;
    }
    if (action) {
      params.push(action);
      query += ` AND al.action = $${params.length}`;
    }
    if (entity_type) {
      params.push(entity_type);
      query += ` AND al.entity_type = $${params.length}`;
    }
    if (entity_id) {
      params.push(entity_id);
      query += ` AND al.entity_id = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      query += ` AND al.created_at >= $${params.length}::date`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND al.created_at <= $${params.length}::date + INTERVAL '1 day'`;
    }

    query += ' ORDER BY al.created_at DESC';

    // Get total count
    const countResult = await pool.query(query.replace('SELECT al.*, u.username', 'SELECT COUNT(*) as total').replace(/ ORDER BY.*$/, ''), params);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Get paginated results
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    res.json({
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE audit log entry
export const createAuditLog = async (data) => {
  try {
    const { user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent } = data;

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user_id, action, entity_type, entity_id, old_values ? JSON.stringify(old_values) : null, new_values ? JSON.stringify(new_values) : null, ip_address, user_agent]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// GET audit log statistics
export const getAuditStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const result = await pool.query(`
      SELECT 
        action,
        entity_type,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1
      GROUP BY action, entity_type
      ORDER BY count DESC
    `, [days]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET recent activity
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const result = await pool.query(`
      SELECT al.*, u.username, u.full_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CLEAR old audit logs
export const clearOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const result = await pool.query(
      `DELETE FROM audit_logs WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * $1 RETURNING id`,
      [days]
    );

    res.json({ message: `Deleted ${result.rowCount} log entries` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};