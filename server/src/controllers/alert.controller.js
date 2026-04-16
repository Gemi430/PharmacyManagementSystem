import pool from '../config/db.js';

// GET all alerts
export const getAlerts = async (req, res) => {
  try {
    const { type, is_read, limit = 50 } = req.query;

    let query = `
      SELECT sa.*, m.name as medicine_name, m.stock, m.min_stock, m.expiry_date
      FROM stock_alerts sa
      JOIN medicines m ON sa.medicine_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND sa.alert_type = $${params.length}`;
    }

    if (is_read !== undefined) {
      params.push(is_read === 'true');
      query += ` AND sa.is_read = $${params.length}`;
    }

    query += ' ORDER BY sa.created_at DESC';
    params.push(limit);
    query += ` LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET unread alert count
export const getAlertCount = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT alert_type, COUNT(*) as count
      FROM stock_alerts
      WHERE is_read = FALSE
      GROUP BY alert_type
    `);

    const counts = {
      low_stock: 0,
      expiring: 0,
      total: 0
    };

    result.rows.forEach(row => {
      counts[row.alert_type] = parseInt(row.count);
      counts.total += parseInt(row.count);
    });

    res.json(counts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// MARK alert as read
export const markAlertRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE stock_alerts SET is_read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// MARK all alerts as read
export const markAllAlertsRead = async (req, res) => {
  try {
    await pool.query('UPDATE stock_alerts SET is_read = TRUE WHERE is_read = FALSE');
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE alert
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM stock_alerts WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GENERATE alerts (run periodically or manually)
export const generateAlerts = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get settings
    const settingsResult = await client.query(`
      SELECT key, value FROM settings WHERE key IN ('low_stock_threshold', 'expiry_warning_days')
    `);
    const settings = {};
    settingsResult.rows.forEach(row => {
      settings[row.key] = parseInt(row.value) || 10;
    });

    const lowStockThreshold = settings.low_stock_threshold || 10;
    const expiryWarningDays = settings.expiry_warning_days || 90;

    // Clear old alerts
    await client.query('DELETE FROM stock_alerts');

    // Generate low stock alerts
    await client.query(`
      INSERT INTO stock_alerts (medicine_id, alert_type, threshold, current_value, message)
      SELECT id, 'low_stock', min_stock, stock,
             CONCAT('Low stock: ', name, ' (Current: ', stock, ', Min: ', min_stock, ')')
      FROM medicines
      WHERE stock <= min_stock
    `);

    // Generate expiry alerts
    await client.query(`
      INSERT INTO stock_alerts (medicine_id, alert_type, threshold, current_value, message)
      SELECT id, 'expiring', $1, stock,
             CONCAT('Expiring soon: ', name, ' (Expiry: ', expiry_date, ')')
      FROM medicines
      WHERE expiry_date IS NOT NULL 
        AND expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $1
        AND expiry_date > CURRENT_DATE
    `, [expiryWarningDays]);

    await client.query('COMMIT');

    res.json({ message: 'Alerts generated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
}

// GET medicines with low stock
export const getLowStockMedicines = async (req, res) => {
  try {
    const { threshold } = req.query;

    let query = `
      SELECT m.*, s.name as supplier_name
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.stock <= m.min_stock
    `;
    const params = [];

    if (threshold) {
      params.push(threshold);
      query += ` AND m.stock <= $1`;
    }

    query += ' ORDER BY m.stock ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET medicines expiring soon
export const getExpiringMedicines = async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const result = await pool.query(`
      SELECT m.*, s.name as supplier_name,
             EXTRACT(DAY FROM expiry_date - CURRENT_DATE) as days_until_expiry
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE m.expiry_date IS NOT NULL
        AND m.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $1
        AND m.expiry_date > CURRENT_DATE
      ORDER BY m.expiry_date ASC
    `, [days]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};