import pool from '../config/db.js';

// GET all categories
export const getCategories = async (req, res) => {
  try {
    const { parent_id } = req.query;
    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM medicines WHERE category = c.name) as medicine_count
      FROM categories c
    `;
    const params = [];

    if (parent_id !== undefined) {
      params.push(parent_id);
      query += ` WHERE c.parent_id ${parent_id === 'null' ? 'IS NULL' : '= $1'}`;
    }

    query += ' ORDER BY c.name';

    const result = parent_id !== undefined && parent_id !== 'null' 
      ? await pool.query(query, params)
      : await pool.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single category
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE category
export const createCategory = async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, description, parent_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, parent_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id } = req.body;

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           parent_id = COALESCE($3, parent_id)
       WHERE id = $4
       RETURNING *`,
      [name, description, parent_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has medicines
    const medicineCheck = await pool.query(
      'SELECT COUNT(*) as count FROM medicines WHERE category IN (SELECT name FROM categories WHERE id = $1)',
      [id]
    );

    if (parseInt(medicineCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete category with medicines' });
    }

    // Check for subcategories
    const subCheck = await pool.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
      [id]
    );

    if (parseInt(subCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete category with subcategories' });
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET category statistics
export const getCategoryStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(m.id) as medicine_count,
        COALESCE(SUM(m.stock), 0) as total_stock,
        COALESCE(SUM(m.stock * m.price), 0) as total_value
      FROM categories c
      LEFT JOIN medicines m ON m.category = c.name
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};