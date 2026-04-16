import pool from '../config/db.js';
import { createTransport } from 'nodemailer';
import { createAuditLog } from './audit.controller.js';

// GET email templates
export const getEmailTemplates = async (req, res) => {
  try {
    const { type, is_active } = req.query;

    let query = 'SELECT * FROM email_templates WHERE 1=1';
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND is_active = $${params.length}`;
    }

    query += ' ORDER BY type, name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single template
export const getEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM email_templates WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE email template
export const createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body, type, is_active } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const result = await pool.query(
      `INSERT INTO email_templates (name, subject, body, type, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, subject, body, type, is_active !== false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE email template
export const updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, type, is_active } = req.body;

    const result = await pool.query(
      `UPDATE email_templates
       SET name = COALESCE($1, name),
           subject = COALESCE($2, subject),
           body = COALESCE($3, body),
           type = COALESCE($4, type),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [name, subject, body, type, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE email template
export const deleteEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM email_templates WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// SEND email
export const sendEmail = async (req, res) => {
  try {
    const { to, subject, body, type } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'To, subject, and body are required' });
    }

    // Get email settings
    const settingsResult = await pool.query("SELECT key, value FROM settings WHERE key LIKE 'email_%'");
    const settings = {};
    settingsResult.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    if (settings.email_enabled !== 'true') {
      // Queue email instead of sending
      await pool.query(
        `INSERT INTO email_queue (to_email, subject, body, type, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [to, subject, body, type || 'general']
      );

      return res.json({ message: 'Email queued for sending', queued: true });
    }

    // Create transporter
    const transporter = createTransport({
      host: settings.email_host,
      port: parseInt(settings.email_port) || 587,
      secure: settings.email_port == '465',
      auth: {
        user: settings.email_user,
        pass: settings.email_password
      }
    });

    // Send email
    await transporter.sendMail({
      from: settings.email_user,
      to,
      subject,
      html: body
    });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send email: ' + error.message });
  }
};

// GET email queue
export const getEmailQueue = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = 'SELECT * FROM email_queue';
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    params.push(limit);
    query += ` LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PROCESS email queue
export const processEmailQueue = async () => {
  try {
    const settingsResult = await pool.query("SELECT key, value FROM settings WHERE key LIKE 'email_%'");
    const settings = {};
    settingsResult.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    if (settings.email_enabled !== 'true') {
      return;
    }

    // Get pending emails
    const pendingResult = await pool.query(
      `SELECT * FROM email_queue
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 10`
    );

    if (pendingResult.rows.length === 0) {
      return;
    }

    // Create transporter
    const transporter = createTransport({
      host: settings.email_host,
      port: parseInt(settings.email_port) || 587,
      secure: settings.email_port == '465',
      auth: {
        user: settings.email_user,
        pass: settings.email_password
      }
    });

    // Process each email
    for (const email of pendingResult.rows) {
      try {
        await transporter.sendMail({
          from: settings.email_user,
          to: email.to_email,
          subject: email.subject,
          html: email.body
        });

        await pool.query(
          `UPDATE email_queue
           SET status = 'sent', sent_at = CURRENT_TIMESTAMP, attempts = attempts + 1
           WHERE id = $1`,
          [email.id]
        );
      } catch (sendError) {
        await pool.query(
          `UPDATE email_queue
           SET status = 'failed', error_message = $1, attempts = attempts + 1, last_attempt = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [sendError.message, email.id]
        );
      }
    }
  } catch (error) {
    console.error('Email queue processing failed:', error);
  }
};

// SEND low stock alert
export const sendLowStockAlert = async (medicine) => {
  try {
    const templateResult = await pool.query(
      `SELECT * FROM email_templates WHERE type = 'low_stock' AND is_active = TRUE LIMIT 1`
    );

    if (templateResult.rows.length === 0) {
      return;
    }

    const template = templateResult.rows[0];
    let body = template.body
      .replace('{{medicine_name}}', medicine.name)
      .replace('{{current_stock}}', medicine.stock)
      .replace('{{min_stock}}', medicine.min_stock);

    // Get admin emails
    const adminResult = await pool.query("SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL");

    for (const admin of adminResult.rows) {
      await pool.query(
        `INSERT INTO email_queue (to_email, subject, body, type, status)
         VALUES ($1, $2, $3, 'low_stock', 'pending')`,
        [admin.email, template.subject.replace('{{medicine_name}}', medicine.name), body]
      );
    }
  } catch (error) {
    console.error('Failed to send low stock alert:', error);
  }
};

// SEND expiry alert
export const sendExpiryAlert = async (medicine, daysRemaining) => {
  try {
    const templateResult = await pool.query(
      `SELECT * FROM email_templates WHERE type = 'expiry' AND is_active = TRUE LIMIT 1`
    );

    if (templateResult.rows.length === 0) {
      return;
    }

    const template = templateResult.rows[0];
    let body = template.body
      .replace('{{medicine_name}}', medicine.name)
      .replace('{{expiry_date}}', new Date(medicine.expiry_date).toLocaleDateString())
      .replace('{{days_remaining}}', daysRemaining);

    // Get admin emails
    const adminResult = await pool.query("SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL");

    for (const admin of adminResult.rows) {
      await pool.query(
        `INSERT INTO email_queue (to_email, subject, body, type, status)
         VALUES ($1, $2, $3, 'expiry', 'pending')`,
        [admin.email, template.subject.replace('{{medicine_name}}', medicine.name), body]
      );
    }
  } catch (error) {
    console.error('Failed to send expiry alert:', error);
  }
};