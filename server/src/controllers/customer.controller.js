import pool from '../config/db.js';

// GET all customers
export const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*,
        (SELECT COUNT(*) FROM sales WHERE customer_phone = c.phone) as purchase_count
      FROM customers c
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      query += ` AND (c.name ILIKE $${params.length - 2} OR c.phone ILIKE $${params.length - 1} OR c.email ILIKE $${params.length})`;
    }

    query += ' ORDER BY c.created_at DESC';

    // Get total count
    const countResult = await pool.query(query.replace('SELECT c.*,', 'SELECT COUNT(*) as total,').replace(/ ORDER BY.*$/, ''), params);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Get paginated results
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      customers: result.rows,
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

// GET single customer
export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get purchase history
    const salesResult = await pool.query(
      `SELECT s.*, COUNT(si.id) as items_count
       FROM sales s
       LEFT JOIN sale_items si ON si.sale_id = s.id
       WHERE s.customer_phone = $1
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT 10`,
      [result.rows[0].phone]
    );

    res.json({
      customer: result.rows[0],
      recent_purchases: salesResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE customer
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    // Check if customer with same phone exists
    if (phone) {
      const existing = await pool.query('SELECT * FROM customers WHERE phone = $1', [phone]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Customer with this phone already exists' });
      }
    }

    const result = await pool.query(
      `INSERT INTO customers (name, phone, email, address, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, phone, email, address, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, notes } = req.body;

    const result = await pool.query(
      `UPDATE customers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           notes = COALESCE($5, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, phone, email, address, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add loyalty points
export const addLoyaltyPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, amount } = req.body;

    const result = await pool.query(
      `UPDATE customers
       SET loyalty_points = loyalty_points + COALESCE($1, 0),
           total_purchases = total_purchases + COALESCE($2, 0),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [points, amount, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET customer statistics
export const getCustomerStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN loyalty_points > 0 THEN 1 END) as active_members,
        SUM(loyalty_points) as total_points,
        SUM(total_purchases) as total_revenue
      FROM customers
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};