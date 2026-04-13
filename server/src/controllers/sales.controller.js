import pool from '../config/db.js';

export const createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, items } = req.body;

    /**
     * items = [
     *  { medicine_id: 1, quantity: 2 },
     *  { medicine_id: 2, quantity: 1 }
     * ]
     */

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in sale' });
    }

    await client.query('BEGIN');

    let total = 0;

    // 1. Create sale
    const saleResult = await client.query(
      `INSERT INTO sales (user_id, total_amount)
       VALUES ($1, $2)
       RETURNING *`,
      [user_id, 0]
    );

    const saleId = saleResult.rows[0].id;

    // 2. Process each item
    for (let item of items) {
      const medicineRes = await client.query(
        'SELECT * FROM medicines WHERE id = $1',
        [item.medicine_id]
      );

      const medicine = medicineRes.rows[0];

      if (!medicine) {
        throw new Error('Medicine not found');
      }

      if (medicine.stock < item.quantity) {
        throw new Error(`Not enough stock for ${medicine.name}`);
      }

      const itemTotal = medicine.price * item.quantity;
      total += itemTotal;

      // insert sale item
      await client.query(
        `INSERT INTO sale_items (sale_id, medicine_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [saleId, item.medicine_id, item.quantity, medicine.price]
      );

      // update stock
      await client.query(
        `UPDATE medicines 
         SET stock = stock - $1 
         WHERE id = $2`,
        [item.quantity, item.medicine_id]
      );
    }

    // 3. Update total
    await client.query(
      `UPDATE sales SET total_amount = $1 WHERE id = $2`,
      [total, saleId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Sale completed successfully 💰',
      sale_id: saleId,
      total
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error.message);

    res.status(500).json({
      message: error.message || 'Sale failed'
    });
  } finally {
    client.release();
  }
};