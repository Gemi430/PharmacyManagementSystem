import pool from '../config/db.js';

// GET all suppliers
export const getSuppliers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR contact_person ILIKE $${params.length})`;
    }

    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single supplier
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Get medicines from this supplier
    const medicines = await pool.query(
      'SELECT * FROM medicines WHERE supplier_id = $1',
      [id]
    );

    res.json({ ...result.rows[0], medicines: medicines.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE supplier
export const createSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, contact_person, phone, email, address]
    );

    res.status(201).json({ message: 'Supplier created successfully', supplier: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE supplier
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;

    const result = await pool.query(
      `UPDATE suppliers SET
        name = COALESCE($1, name),
        contact_person = COALESCE($2, contact_person),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        address = COALESCE($5, address)
       WHERE id = $6
       RETURNING *`,
      [name, contact_person, phone, email, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier updated successfully', supplier: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE supplier
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier has medicines
    const medicines = await pool.query(
      'SELECT COUNT(*) as count FROM medicines WHERE supplier_id = $1',
      [id]
    );

    if (parseInt(medicines.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete supplier with associated medicines. Remove or reassign medicines first.'
      });
    }

    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};