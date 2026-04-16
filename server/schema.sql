 -- Pharmacy Management System Database Schema
-- Run this in PostgreSQL to create all tables

-- Users table (pharmacists, admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'pharmacist',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100),
    category VARCHAR(50),
    description TEXT,
    dosage_form VARCHAR(50),
    strength VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2),
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 10,
    expiry_date DATE,
    supplier_id INT REFERENCES suppliers(id),
    barcode VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    payment_method VARCHAR(20) DEFAULT 'cash',
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id INT REFERENCES medicines(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    medicine_id INT REFERENCES medicines(id),
    transaction_type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT,
    new_stock INT,
    reference_id INT,
    reference_type VARCHAR(50),
    notes TEXT,
    user_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES suppliers(id),
    user_id INT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10, 2),
    expected_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    medicine_id INT REFERENCES medicines(id),
    quantity INT NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    received_quantity INT DEFAULT 0
);

-- Inventory adjustments table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    medicine_id INT REFERENCES medicines(id),
    type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT,
    new_stock INT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports summary table
CREATE TABLE IF NOT EXISTS daily_sales_summary (
    id SERIAL PRIMARY KEY,
    sale_date DATE UNIQUE NOT NULL,
    total_sales DECIMAL(10, 2) DEFAULT 0,
    total_transactions INT DEFAULT 0,
    total_items_sold INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON inventory_transactions(medicine_id);

