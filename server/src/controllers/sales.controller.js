import pool from '../config/db.js';

// GET all sales with filters
export const getSales = async (req, res) => {
  try {
    const { start_date, end_date, user_id } = req.query;
    let query = `
      SELECT s.*, u.username as cashier_name,
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND s.created_at >= $${params.length}::date`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND s.created_at <= $${params.length}::date + INTERVAL '1 day'`;
    }
    if (user_id) {
      params.push(user_id);
      query += ` AND s.user_id = $${params.length}`;
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single sale with items
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const saleResult = await pool.query(
      `SELECT s.*, u.username as cashier_name 
       FROM sales s 
       LEFT JOIN users u ON s.user_id = u.id 
       WHERE s.id = $1`,
      [id]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const itemsResult = await pool.query(
      `SELECT si.*, m.name as medicine_name, m.generic_name
       FROM sale_items si
       JOIN medicines m ON si.medicine_id = m.id
       WHERE si.sale_id = $1`,
      [id]
    );

    res.json({
      ...saleResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE sale
export const createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, items, customer_name, customer_phone, discount, tax, payment_method, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in sale' });
    }

    await client.query('BEGIN');

    let subtotal = 0;
    let totalItems = 0;

    // Calculate subtotal and validate stock
    for (let item of items) {
      const medicineRes = await client.query(
        'SELECT * FROM medicines WHERE id = $1 FOR UPDATE',
        [item.medicine_id]
      );

      const medicine = medicineRes.rows[0];
      if (!medicine) {
        throw new Error(`Medicine with ID ${item.medicine_id} not found`);
      }
      if (medicine.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock}`);
      }

      subtotal += medicine.price * item.quantity;
      totalItems += item.quantity;
    }

    const discountAmount = discount || 0;
    const taxAmount = tax || 0;
    const total = subtotal - discountAmount + taxAmount;

    // Create sale
    const saleResult = await client.query(
      `INSERT INTO sales 
       (user_id, customer_name, customer_phone, total_amount, discount, tax, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id, customer_name, customer_phone, total, discountAmount, taxAmount, payment_method || 'cash', notes]
    );

    const saleId = saleResult.rows[0].id;

    // Create sale items and update stock
    for (let item of items) {
      const medicineRes = await client.query(
        'SELECT price, name FROM medicines WHERE id = $1',
        [item.medicine_id]
      );
      const medicine = medicineRes.rows[0];
      const itemSubtotal = medicine.price * item.quantity;

      await client.query(
        `INSERT INTO sale_items (sale_id, medicine_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, item.medicine_id, item.quantity, medicine.price, itemSubtotal]
      );

      // Update stock
      await client.query(
        `UPDATE medicines SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.medicine_id]
      );

      // Log inventory transaction
      await client.query(
        `INSERT INTO inventory_transactions 
         (medicine_id, transaction_type, quantity, previous_stock, new_stock, reference_id, reference_type, user_id, notes)
         VALUES ($1, 'sale', $2, stock - $2, stock, $3, 'sale', $4, 'Sale transaction')`,
        [item.medicine_id, item.quantity, saleId, user_id]
      );
    }

    // Update daily summary
    await client.query(
      `INSERT INTO daily_sales_summary (sale_date, total_sales, total_transactions, total_items_sold)
       VALUES (CURRENT_DATE, $1, 1, $2)
       ON CONFLICT (sale_date) DO UPDATE SET
         total_sales = daily_sales_summary.total_sales + $1,
         total_transactions = daily_sales_summary.total_transactions + 1,
         total_items_sold = daily_sales_summary.total_items_sold + $2`,
      [total, totalItems]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Sale completed successfully',
      sale: { ...saleResult.rows[0], item_count: items.length }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(400).json({ message: error.message || 'Sale failed' });
  } finally {
    client.release();
  }
};

// GET sales statistics
export const getSalesStats = async (req, res) => {
  try {
    const period = req.query.period || 'today';
    
    let dateFilter = '';
    if (period === 'today') {
      dateFilter = "AND created_at >= CURRENT_DATE";
    } else if (period === 'week') {
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    // Total sales
    const totalSalesResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
       FROM sales WHERE status = 'completed' ${dateFilter}`
    );

    // Top selling medicines
    const topMedicinesResult = await pool.query(
      `SELECT m.name, SUM(si.quantity) as total_quantity, SUM(si.subtotal) as total_revenue
       FROM sale_items si
       JOIN medicines m ON si.medicine_id = m.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.status = 'completed' ${dateFilter.replace('created_at', 's.created_at')}
       GROUP BY m.id, m.name
       ORDER BY total_quantity DESC
       LIMIT 5`
    );

    // Sales by category
    const categorySalesResult = await pool.query(
      `SELECT m.category, SUM(si.subtotal) as total_revenue, COUNT(*) as total_items
       FROM sale_items si
       JOIN medicines m ON si.medicine_id = m.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.status = 'completed' ${dateFilter.replace('created_at', 's.created_at')}
       GROUP BY m.category
       ORDER BY total_revenue DESC`
    );

    // Daily sales for chart
    const dailySalesResult = await pool.query(
      `SELECT DATE(created_at) as date, SUM(total_amount) as total, COUNT(*) as transactions
       FROM sales
       WHERE status = 'completed' ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    res.json({
      totalSales: totalSalesResult.rows[0],
      topMedicines: topMedicinesResult.rows,
      categorySales: categorySalesResult.rows,
      dailySales: dailySalesResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel sale
export const cancelSale = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    await client.query('BEGIN');

    // Get sale items
    const saleItems = await client.query(
      'SELECT * FROM sale_items WHERE sale_id = $1',
      [id]
    );

    // Restore stock
    for (let item of saleItems.rows) {
      await client.query(
        `UPDATE medicines SET stock = stock + $1 WHERE id = $2`,
        [item.quantity, item.medicine_id]
      );

      await client.query(
        `INSERT INTO inventory_transactions 
         (medicine_id, transaction_type, quantity, previous_stock, new_stock, reference_id, reference_type, notes)
         VALUES ($1, 'sale_cancelled', $2, stock - $2, stock, $3, 'sale', $4)`,
        [item.medicine_id, item.quantity, id, reason || 'Sale cancelled']
      );
    }

    // Update sale status
    await client.query(
      `UPDATE sales SET status = 'cancelled', notes = $1 WHERE id = $2`,
      [reason, id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Sale cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};