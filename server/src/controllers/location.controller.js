import pool from '../config/db.js';

// GET all locations
export const getLocations = async (req, res) => {
  try {
    const { is_active } = req.query;

    let query = 'SELECT * FROM locations';
    const params = [];

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` WHERE is_active = $${params.length}`;
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single location
export const getLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE location
export const createLocation = async (req, res) => {
  try {
    const { name, address, phone, email, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Location name is required' });
    }

    const result = await pool.query(
      `INSERT INTO locations (name, address, phone, email, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, address, phone, email, is_active !== false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE location
export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, is_active } = req.body;

    const result = await pool.query(
      `UPDATE locations
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [name, address, phone, email, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE location
export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if location has users or inventory
    const checkResult = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE location_id = $1) as user_count,
        (SELECT COUNT(*) FROM medicines WHERE location_id = $1) as medicine_count,
        (SELECT COUNT(*) FROM sales WHERE location_id = $1) as sale_count`,
      [id]
    );

    const counts = checkResult.rows[0];
    if (parseInt(counts.user_count) > 0 || parseInt(counts.medicine_count) > 0 || parseInt(counts.sale_count) > 0) {
      return res.status(400).json({
        message: 'Cannot delete location with associated users, medicines, or sales. Set is_active to false instead.'
      });
    }

    const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET location statistics
export const getLocationStats = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        l.id,
        l.name,
        COUNT(DISTINCT m.id) as medicine_count,
        COALESCE(SUM(m.stock), 0) as total_stock,
        COALESCE(SUM(m.stock * m.price), 0) as inventory_value,
        COUNT(DISTINCT s.id) as today_sales,
        COALESCE(SUM(s.total_amount), 0) as today_revenue
      FROM locations l
      LEFT JOIN medicines m ON m.location_id = l.id
      LEFT JOIN sales s ON s.location_id = l.id AND s.created_at >= CURRENT_DATE
      WHERE l.id = $1
      GROUP BY l.id, l.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// TRANSFER inventory between locations
export const transferInventory = async (req, res) => {
  const client = await pool.connect();

  try {
    const { from_location_id, to_location_id, medicine_id, quantity, notes } = req.body;
    const user_id = req.user?.id;

    if (!from_location_id || !to_location_id || !medicine_id || !quantity) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (from_location_id === to_location_id) {
      return res.status(400).json({ message: 'Source and destination must be different' });
    }

    await client.query('BEGIN');

    // Get medicine at source location
    const medicineResult = await client.query(
      'SELECT * FROM medicines WHERE id = $1 AND location_id = $2',
      [medicine_id, from_location_id]
    );

    if (medicineResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Medicine not found at source location' });
    }

    const medicine = medicineResult.rows[0];

    if (medicine.stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient stock at source location' });
    }

    // Check if medicine exists at destination
    const destMedicineResult = await client.query(
      'SELECT * FROM medicines WHERE id = $1 AND location_id = $2',
      [medicine_id, to_location_id]
    );

    let newDestStock;
    if (destMedicineResult.rows.length > 0) {
      // Update existing medicine at destination
      newDestStock = destMedicineResult.rows[0].stock + quantity;
      await client.query(
        'UPDATE medicines SET stock = $1 WHERE id = $2',
        [newDestStock, destMedicineResult.rows[0].id]
      );
    } else {
      // Create new medicine entry at destination
      const newMedicine = await client.query(
        `INSERT INTO medicines (name, generic_name, category, description, dosage_form, strength, price, cost_price, stock, min_stock, expiry_date, supplier_id, barcode, location_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [medicine.name, medicine.generic_name, medicine.category, medicine.description, medicine.dosage_form, medicine.strength, medicine.price, medicine.cost_price, quantity, medicine.min_stock, medicine.expiry_date, medicine.supplier_id, medicine.barcode, to_location_id]
      );
      newDestStock = quantity;
    }

    // Update source medicine
    const newSourceStock = medicine.stock - quantity;
    await client.query(
      'UPDATE medicines SET stock = $1 WHERE id = $2',
      [newSourceStock, medicine.id]
    );

    // Log transactions
    await client.query(
      `INSERT INTO inventory_transactions (medicine_id, transaction_type, quantity, previous_stock, new_stock, reference_id, reference_type, user_id, notes)
       VALUES ($1, 'transfer_out', $2, $3, $4, $5, 'location_transfer', $6, $7)`,
      [medicine.id, quantity, medicine.stock, newSourceStock, null, user_id, notes]
    );

    await client.query(
      `INSERT INTO inventory_transactions (medicine_id, transaction_type, quantity, previous_stock, new_stock, reference_id, reference_type, user_id, notes)
       VALUES ($1, 'transfer_in', $2, $3, $4, $5, 'location_transfer', $6, $7)`,
      [destMedicineResult.rows[0]?.id || newMedicine.rows[0].id, quantity, (destMedicineResult.rows[0]?.stock || 0), newDestStock, null, user_id, notes]
    );

    await client.query('COMMIT');

    res.json({ message: 'Inventory transferred successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};