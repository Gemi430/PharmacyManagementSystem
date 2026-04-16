import pool from '../config/db.js';

// GET all settings
export const getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY key');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single setting
export const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE setting
export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const result = await pool.query(
      `UPDATE settings
       SET value = COALESCE($1, value),
           description = COALESCE($2, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE key = $3
       RETURNING *`,
      [value, description, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPSERT setting
export const upsertSetting = async (req, res) => {
  try {
    const { key, value, description } = req.body;

    if (!key) {
      return res.status(400).json({ message: 'Setting key is required' });
    }

    const result = await pool.query(
      `INSERT INTO settings (key, value, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (key)
       DO UPDATE SET value = COALESCE($2, settings.value),
                     description = COALESCE($3, settings.description),
                     updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value, description]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET dashboard settings (commonly used)
export const getDashboardSettings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT key, value FROM settings WHERE key IN (
        'tax_rate', 'currency', 'low_stock_threshold', 'expiry_warning_days',
        'store_name', 'store_address', 'store_phone'
      )
    `);

    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};