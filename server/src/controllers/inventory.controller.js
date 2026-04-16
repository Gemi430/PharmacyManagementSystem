import pool from '../config/db.js';

// GET all inventory adjustments
export const getInventoryAdjustments = async (req, res) => {
  try {
    const { type, medicine_id, start_date, end_date } = req.query;
    let query = `
      SELECT ia.*, m.name as medicine_name, u.username as adjusted_by
      FROM inventory_adjustments ia
      JOIN medicines m ON ia.medicine_id = m.id
      JOIN users u ON ia.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND ia.type = $${params.length}`;
    }
    if (medicine_id) {
      params.push(medicine_id);
      query += ` AND ia.medicine_id = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      query += ` AND ia.created_at >= $${params.length}::date`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND ia.created_at <= $${params.length}::date + INTERVAL '1 day'`;
    }

    query += ' ORDER BY ia.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE inventory adjustment
export const createInventoryAdjustment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, medicine_id, type, quantity, reason } = req.body;

    if (!medicine_id || !type || !quantity) {
      return res.status(400).json({ message: 'Medicine, type, and quantity are required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be positive' });
    }

    await client.query('BEGIN');

    // Get current stock
    const medicineResult = await client.query(
      'SELECT * FROM medicines WHERE id = $1',
      [medicine_id]
    );

    if (medicineResult.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const medicine = medicineResult.rows[0];
    const previousStock = parseInt(medicine.stock);
    let newStock;

    // Calculate new stock based on adjustment type
    switch (type) {
      case 'damaged':
      case 'lost':
        newStock = previousStock - quantity;
        if (newStock < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: `Insufficient stock. Current: ${previousStock}` });
        }
        break;
      case 'found':
      case 'returned':
        newStock = previousStock + quantity;
        break;
      case 'count':
        // For count adjustment, quantity is the new stock count
        newStock = quantity;
        break;
      default:
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid adjustment type' });
    }

    // Update medicine stock
    await client.query(
      'UPDATE medicines SET stock = $1 WHERE id = $2',
      [newStock, medicine_id]
    );

    // Log inventory adjustment
    const adjustmentResult = await client.query(
      `INSERT INTO inventory_adjustments (user_id, medicine_id, type, quantity, previous_stock, new_stock, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, medicine_id, type, quantity, previousStock, newStock, reason]
    );

    // Also log in inventory_transactions
    await client.query(
      `INSERT INTO inventory_transactions (medicine_id, transaction_type, quantity, previous_stock, new_stock, reference_id, reference_type, user_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'inventory_adjustment', $7, $8)`,
      [medicine_id, type, quantity, previousStock, newStock, adjustmentResult.rows[0].id, user_id, reason]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Inventory adjusted successfully',
      adjustment: adjustmentResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// GET adjustment types summary
export const getAdjustmentSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT type, COUNT(*) as count, SUM(quantity) as total_quantity
      FROM inventory_adjustments
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY type
      ORDER BY count DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};