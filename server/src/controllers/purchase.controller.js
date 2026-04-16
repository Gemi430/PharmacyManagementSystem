import pool from '../config/db.js';

// GET all purchase orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplier_id } = req.query;
    let query = `
      SELECT po.*, s.name as supplier_name, u.username as created_by
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND po.status = $${params.length}`;
    }
    if (supplier_id) {
      params.push(supplier_id);
      query += ` AND po.supplier_id = $${params.length}`;
    }

    query += ' ORDER BY po.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single purchase order with items
export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const poResult = await pool.query(
      `SELECT po.*, s.name as supplier_name, u.username as created_by
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       LEFT JOIN users u ON po.user_id = u.id
       WHERE po.id = $1`,
      [id]
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const itemsResult = await pool.query(
      `SELECT poi.*, m.name as medicine_name
       FROM purchase_order_items poi
       JOIN medicines m ON poi.medicine_id = m.id
       WHERE poi.purchase_order_id = $1`,
      [id]
    );

    res.json({
      ...poResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE purchase order
export const createPurchaseOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, supplier_id, expected_date, notes, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in purchase order' });
    }

    await client.query('BEGIN');

    // Calculate total
    let total = 0;
    for (let item of items) {
      total += item.quantity * item.unit_cost;
    }

    // Create purchase order
    const poResult = await client.query(
      `INSERT INTO purchase_orders (user_id, supplier_id, total_amount, expected_date, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [user_id, supplier_id, total, expected_date, notes]
    );

    const poId = poResult.rows[0].id;

    // Create items
    for (let item of items) {
      await client.query(
        `INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_cost)
         VALUES ($1, $2, $3, $4)`,
        [poId, item.medicine_id, item.quantity, item.unit_cost]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Purchase order created successfully',
      purchase_order: poResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// UPDATE purchase order status
export const updatePurchaseOrderStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status } = req.body;

    await client.query('BEGIN');

    // Get purchase order
    const poResult = await client.query(
      'SELECT * FROM purchase_orders WHERE id = $1',
      [id]
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const po = poResult.rows[0];

    // If receiving order, update stock
    if (status === 'received' && po.status !== 'received') {
      const itemsResult = await client.query(
        'SELECT * FROM purchase_order_items WHERE purchase_order_id = $1',
        [id]
      );

      for (let item of itemsResult.rows) {
        // Update medicine stock
        await client.query(
          `UPDATE medicines SET stock = stock + $1 WHERE id = $2`,
          [item.quantity, item.medicine_id]
        );

        // Log inventory transaction
        await client.query(
          `INSERT INTO inventory_transactions 
           (medicine_id, transaction_type, quantity, previous_stock, new_stock, reference_id, reference_type, notes)
           VALUES ($1, 'purchase', $2, stock - $2, stock, $3, 'purchase_order', 'Stock received from purchase order')`,
          [item.medicine_id, item.quantity, id]
        );

        // Update received quantity
        await client.query(
          `UPDATE purchase_order_items SET received_quantity = $1 WHERE id = $2`,
          [item.quantity, item.id]
        );
      }
    }

    // Update status
    await client.query(
      `UPDATE purchase_orders SET status = $1 WHERE id = $2`,
      [status, id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Purchase order status updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// DELETE purchase order
export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM purchase_orders WHERE id = $1 AND status = $2 RETURNING *',
      [id, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        message: 'Cannot delete purchase order. Only pending orders can be deleted.' 
      });
    }

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};