import pool from '../config/db.js';

// GET all medicines with optional filters
export const getMedicines = async (req, res) => {
  try {
    const { category, search, low_stock, expiring_soon } = req.query;
    let query = 'SELECT m.*, s.name as supplier_name FROM medicines m LEFT JOIN suppliers s ON m.supplier_id = s.id WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      query += ' AND m.category = $' + params.length;
    }
    if (search) {
      params.push('%' + search + '%');
      query += ' AND (m.name ILIKE $' + params.length + ' OR m.generic_name ILIKE $' + params.length + ')';
    }
    if (low_stock === 'true') {
      query += ' AND m.stock <= m.min_stock';
    }
    if (expiring_soon === 'true') {
      query += " AND m.expiry_date <= CURRENT_DATE + INTERVAL '90 days'";
    }

    query += ' ORDER BY m.id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single medicine
export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT m.*, s.name as supplier_name FROM medicines m LEFT JOIN suppliers s ON m.supplier_id = s.id WHERE m.id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADD medicine
export const addMedicine = async (req, res) => {
  try {
    const { 
      name, generic_name, category, description, dosage_form, strength,
      price, cost_price, stock, min_stock, expiry_date, supplier_id, barcode 
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const result = await pool.query(
      `INSERT INTO medicines 
       (name, generic_name, category, description, dosage_form, strength,
        price, cost_price, stock, min_stock, expiry_date, supplier_id, barcode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [name, generic_name, category, description, dosage_form, strength,
       price, cost_price, stock || 0, min_stock || 10, expiry_date, supplier_id, barcode]
    );

    // Log inventory transaction
    if (stock > 0) {
      await pool.query(
        `INSERT INTO inventory_transactions 
         (medicine_id, transaction_type, quantity, previous_stock, new_stock, notes)
         VALUES ($1, 'purchase', $2, 0, $2, 'Initial stock')`,
        [result.rows[0].id, stock]
      );
    }

    res.status(201).json({ message: 'Medicine added successfully', medicine: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE medicine
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, generic_name, category, description, dosage_form, strength,
      price, cost_price, stock, min_stock, expiry_date, supplier_id, barcode 
    } = req.body;

    // Get current stock
    const current = await pool.query('SELECT stock FROM medicines WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const previousStock = current.rows[0].stock;

    const result = await pool.query(
      `UPDATE medicines SET
        name = COALESCE($1, name),
        generic_name = COALESCE($2, generic_name),
        category = COALESCE($3, category),
        description = COALESCE($4, description),
        dosage_form = COALESCE($5, dosage_form),
        strength = COALESCE($6, strength),
        price = COALESCE($7, price),
        cost_price = COALESCE($8, cost_price),
        stock = COALESCE($9, stock),
        min_stock = COALESCE($10, min_stock),
        expiry_date = COALESCE($11, expiry_date),
        supplier_id = COALESCE($12, supplier_id),
        barcode = COALESCE($13, barcode),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [name, generic_name, category, description, dosage_form, strength,
       price, cost_price, stock, min_stock, expiry_date, supplier_id, barcode, id]
    );

    // Log stock change
    if (stock !== undefined && stock !== previousStock) {
      const transactionType = stock > previousStock ? 'purchase' : 'adjustment';
      await pool.query(
        `INSERT INTO inventory_transactions 
         (medicine_id, transaction_type, quantity, previous_stock, new_stock, notes)
         VALUES ($1, $2, $3, $4, $5, 'Stock adjustment')`,
        [id, transactionType, Math.abs(stock - previousStock), previousStock, stock]
      );
    }

    res.json({ message: 'Medicine updated successfully', medicine: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE medicine
export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM medicines WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET medicine categories
export const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM medicines WHERE category IS NOT NULL ORDER BY category');
    res.json(result.rows.map(r => r.category));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET low stock medicines
export const getLowStockMedicines = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM medicines WHERE stock <= min_stock ORDER BY stock ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET expiring medicines
export const getExpiringMedicines = async (req, res) => {
  try {
    const days = req.query.days || 90;
    const result = await pool.query(
      `SELECT * FROM medicines 
       WHERE expiry_date IS NOT NULL 
       AND expiry_date <= CURRENT_DATE + INTERVAL '` + days + ` days'
       ORDER BY expiry_date ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};