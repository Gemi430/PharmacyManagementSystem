import pool from '../config/db.js';

// GET all medicines
export const getMedicines = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM medicines ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADD medicine
export const addMedicine = async (req, res) => {
  try {
    const { name, category, price, stock, expiry_date, supplier_id } = req.body;

    // 🧪 basic validation
    if (!name || !price || !stock || !expiry_date) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    const result = await pool.query(
      `INSERT INTO medicines 
       (name, category, price, stock, expiry_date, supplier_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category, price, stock, expiry_date, supplier_id]
    );

    res.status(201).json({
      message: 'Medicine added successfully 💊',
      medicine: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};