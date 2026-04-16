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

-- Locations table (for multi-location support)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add location_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_id INT REFERENCES locations(id);

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
    location_id INT REFERENCES locations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    location_id INT REFERENCES locations(id),
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
    location_id INT REFERENCES locations(id),
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

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    loyalty_points INT DEFAULT 0,
    total_purchases DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock alerts table
CREATE TABLE IF NOT EXISTS stock_alerts (
    id SERIAL PRIMARY KEY,
    medicine_id INT REFERENCES medicines(id),
    alert_type VARCHAR(20) NOT NULL,
    threshold INT,
    current_value INT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backups table
CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    backup_type VARCHAR(20) DEFAULT 'full',
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    body TEXT,
    type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id SERIAL PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    attempts INT DEFAULT 0,
    last_attempt TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports summary table
CREATE TABLE IF NOT EXISTS daily_sales_summary (
    id SERIAL PRIMARY KEY,
    sale_date DATE UNIQUE NOT NULL,
    location_id INT REFERENCES locations(id),
    total_sales DECIMAL(10, 2) DEFAULT 0,
    total_transactions INT DEFAULT 0,
    total_items_sold INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON inventory_transactions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_read ON stock_alerts(is_read);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('tax_rate', '10', 'Default tax rate percentage'),
('currency', 'USD', 'Currency symbol'),
('low_stock_threshold', '10', 'Default low stock threshold'),
('expiry_warning_days', '90', 'Days before expiry to show warning'),
('store_name', 'Pharmacy Management System', 'Store name'),
('store_address', '', 'Store address'),
('store_phone', '', 'Store phone number'),
('email_enabled', 'false', 'Enable email notifications'),
('email_host', '', 'SMTP host'),
('email_port', '587', 'SMTP port'),
('email_user', '', 'SMTP username'),
('email_password', '', 'SMTP password'),
('backup_retention_days', '30', 'Days to keep backups')
ON CONFLICT (key) DO NOTHING;

-- Insert default locations
INSERT INTO locations (name, address, phone, email) VALUES
('Main Branch', '123 Main Street, City Center', '555-0001', 'main@pharmacy.com'),
('North Branch', '456 North Avenue, North District', '555-0002', 'north@pharmacy.com'),
('South Branch', '789 South Road, South District', '555-0003', 'south@pharmacy.com')
ON CONFLICT DO NOTHING;

-- Insert email templates
INSERT INTO email_templates (name, subject, body, type) VALUES
('Low Stock Alert', 'Low Stock Alert: {{medicine_name}}', 'Dear Admin,\n\nThe following medicine is running low on stock:\n\nMedicine: {{medicine_name}}\nCurrent Stock: {{current_stock}}\nMin Stock: {{min_stock}}\n\nPlease restock soon.\n\nBest regards,\nPharmacy Management System', 'low_stock'),
('Expiry Alert', 'Expiring Soon: {{medicine_name}}', 'Dear Admin,\n\nThe following medicine is expiring soon:\n\nMedicine: {{medicine_name}}\nExpiry Date: {{expiry_date}}\nDays Remaining: {{days_remaining}}\n\nPlease take appropriate action.\n\nBest regards,\nPharmacy Management System', 'expiry'),
('Order Confirmation', 'Purchase Order Confirmed: #{{order_id}}', 'Dear {{supplier_name}},\n\nYour purchase order #{{order_id}} has been confirmed.\n\nItems:\n{{items}}\n\nTotal Amount: {{total_amount}}\nExpected Delivery: {{expected_date}}\n\nBest regards,\nPharmacy Management System', 'order_confirmation')
ON CONFLICT DO NOTHING;