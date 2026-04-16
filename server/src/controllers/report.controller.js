import pool from '../config/db.js';

// GET inventory report
export const getInventoryReport = async (req, res) => {
  try {
    const { category, low_stock, expiring } = req.query;

    let query = `
      SELECT m.*, s.name as supplier_name
      FROM medicines m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND m.category = $${params.length}`;
    }
    if (low_stock === 'true') {
      query += ' AND m.stock <= m.min_stock';
    }
    if (expiring === 'true') {
      query += ` AND m.expiry_date <= CURRENT_DATE + INTERVAL '90 days'`;
    }

    query += ' ORDER BY m.stock ASC';

    const result = await pool.query(query, params);

    // Calculate summary
    const summary = {
      totalMedicines: result.rows.length,
      totalValue: result.rows.reduce((sum, m) => sum + (m.price * m.stock), 0),
      lowStockCount: result.rows.filter(m => m.stock <= m.min_stock).length,
      expiringCount: result.rows.filter(m => {
        if (!m.expiry_date) return false;
        const expiry = new Date(m.expiry_date);
        const now = new Date();
        const daysToExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
        return daysToExpiry <= 90;
      }).length
    };

    res.json({ medicines: result.rows, summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET sales report
export const getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = `WHERE created_at >= '${start_date}' AND created_at <= '${end_date}'`;
    }

    // Sales summary
    const summaryResult = await pool.query(
      `SELECT 
         COUNT(*) as total_transactions,
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(AVG(total_amount), 0) as avg_transaction,
         COALESCE(SUM(discount), 0) as total_discounts
       FROM sales ${dateFilter ? dateFilter.replace('created_at', '') + ' AND' : 'WHERE'} status = 'completed'`
    );

    // Sales by payment method
    const paymentResult = await pool.query(
      `SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total
       FROM sales ${dateFilter ? dateFilter.replace('created_at', '') + ' AND' : 'WHERE'} status = 'completed'
       GROUP BY payment_method`
    );

    // Top medicines
    const topMedicinesResult = await pool.query(
      `SELECT m.name, m.category, SUM(si.quantity) as total_qty, SUM(si.subtotal) as total_revenue
       FROM sale_items si
       JOIN medicines m ON si.medicine_id = m.id
       JOIN sales s ON si.sale_id = s.id
       ${dateFilter ? dateFilter.replace('created_at', 's.created_at') : ''}
       AND s.status = 'completed'
       GROUP BY m.id, m.name, m.category
       ORDER BY total_revenue DESC
       LIMIT 10`
    );

    // Sales by category
    const categoryResult = await pool.query(
      `SELECT m.category, COUNT(*) as items_sold, SUM(si.subtotal) as total_revenue
       FROM sale_items si
       JOIN medicines m ON si.medicine_id = m.id
       JOIN sales s ON si.sale_id = s.id
       ${dateFilter ? dateFilter.replace('created_at', 's.created_at') : ''}
       AND s.status = 'completed'
       GROUP BY m.category
       ORDER BY total_revenue DESC`
    );

    // Daily sales trend
    let dailyQuery = '';
    if (group_by === 'day') {
      dailyQuery = `SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as transactions
                    FROM sales ${dateFilter ? dateFilter.replace('created_at', '') + ' AND' : 'WHERE'} status = 'completed'
                    GROUP BY DATE(created_at) ORDER BY date`;
    } else {
      dailyQuery = `SELECT DATE_TRUNC('week', created_at) as date, SUM(total_amount) as revenue, COUNT(*) as transactions
                    FROM sales ${dateFilter ? dateFilter.replace('created_at', '') + ' AND' : 'WHERE'} status = 'completed'
                    GROUP BY DATE_TRUNC('week', created_at) ORDER BY date`;
    }
    const dailyResult = await pool.query(dailyQuery);

    res.json({
      summary: summaryResult.rows[0],
      paymentMethods: paymentResult.rows,
      topMedicines: topMedicinesResult.rows,
      categorySales: categoryResult.rows,
      dailySales: dailyResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET expiry report
export const getExpiryReport = async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const result = await pool.query(
      `SELECT * FROM medicines 
       WHERE expiry_date IS NOT NULL 
       AND expiry_date <= CURRENT_DATE + INTERVAL '${days} days'
       ORDER BY expiry_date ASC`
    );

    const summary = {
      totalExpiring: result.rows.length,
      expired: result.rows.filter(m => new Date(m.expiry_date) < new Date()).length,
      thisMonth: result.rows.filter(m => {
        const expiry = new Date(m.expiry_date);
        const now = new Date();
        return expiry.getMonth() === now.getMonth() && expiry.getFullYear() === now.getFullYear();
      }).length,
      totalValueAtRisk: result.rows.reduce((sum, m) => sum + (m.price * m.stock), 0)
    };

    res.json({ medicines: result.rows, summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET supplier report
export const getSupplierReport = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
              COUNT(m.id) as medicine_count,
              COALESCE(SUM(m.stock), 0) as total_stock,
              COALESCE(SUM(m.price * m.stock), 0) as total_value
       FROM suppliers s
       LEFT JOIN medicines m ON s.id = m.supplier_id
       GROUP BY s.id
       ORDER BY total_value DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    // Today's sales
    const todaySales = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as transactions
       FROM sales 
       WHERE status = 'completed' AND created_at >= CURRENT_DATE`
    );

    // This month's sales
    const monthSales = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as transactions
       FROM sales 
       WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`
    );

    // Low stock items
    const lowStock = await pool.query(
      'SELECT COUNT(*) as count FROM medicines WHERE stock <= min_stock'
    );

    // Expiring soon
    const expiringSoon = await pool.query(
      `SELECT COUNT(*) as count FROM medicines 
       WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'`
    );

    // Total medicines
    const totalMedicines = await pool.query('SELECT COUNT(*) as count FROM medicines');

    // Recent sales
    const recentSales = await pool.query(
      `SELECT s.*, u.username as cashier_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC
       LIMIT 5`
    );

    // Top selling today
    const topSelling = await pool.query(
      `SELECT m.name, SUM(si.quantity) as total_qty
       FROM sale_items si
       JOIN medicines m ON si.medicine_id = m.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.created_at >= CURRENT_DATE AND s.status = 'completed'
       GROUP BY m.id, m.name
       ORDER BY total_qty DESC
       LIMIT 5`
    );

    res.json({
      todaySales: todaySales.rows[0],
      monthSales: monthSales.rows[0],
      lowStock: lowStock.rows[0].count,
      expiringSoon: expiringSoon.rows[0].count,
      totalMedicines: totalMedicines.rows[0].count,
      recentSales: recentSales.rows,
      topSelling: topSelling.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};