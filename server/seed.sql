-- Seed Data for Pharmacy Management System
-- Run this after creating all tables

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Analgesics', 'Pain relief medications'),
('Antibiotics', 'Antibacterial medications'),
('Antipyretics', 'Fever reducing medications'),
('Antihistamines', 'Allergy medications'),
('Vitamins & Supplements', 'Nutritional supplements'),
('Cardiovascular', 'Heart and blood pressure medications'),
('Respiratory', 'Breathing and respiratory medications'),
('Gastrointestinal', 'Digestive system medications'),
('Dermatological', 'Skin care medications'),
('Eye & Ear', 'Eye and ear medications')
ON CONFLICT (name) DO NOTHING;

-- Insert suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
('PharmaCare Distributors', 'John Smith', '555-0101', 'john@pharmacare.com', '123 Pharma St, City'),
('MediSupply Inc', 'Sarah Johnson', '555-0102', 'sarah@medisupply.com', '456 Supply Ave, Town'),
('HealthFirst Pharmaceuticals', 'Mike Brown', '555-0103', 'mike@healthfirst.com', '789 Health Blvd, Village'),
('Global Pharma Solutions', 'Emily Davis', '555-0104', 'emily@globalpharma.com', '321 Global Rd, Metro')
ON CONFLICT DO NOTHING;

-- Insert medicines
INSERT INTO medicines (name, generic_name, category, description, dosage_form, strength, price, cost_price, stock, min_stock, expiry_date, supplier_id, barcode) VALUES
('Panadol', 'Paracetamol', 'Analgesics', 'General pain reliever and fever reducer', 'Tablet', '500mg', 5.00, 3.00, 150, 20, '2026-12-31', 1, '1234567890123'),
('Brufen', 'Ibuprofen', 'Analgesics', 'NSAID for pain and inflammation', 'Tablet', '400mg', 8.00, 5.00, 100, 15, '2026-06-30', 1, '1234567890124'),
('Amoxil', 'Amoxicillin', 'Antibiotics', 'Broad spectrum antibiotic', 'Capsule', '500mg', 12.00, 8.00, 80, 25, '2026-09-15', 2, '1234567890125'),
('Cetrizine', 'Cetirizine', 'Antihistamines', 'Anti-allergy medication', 'Tablet', '10mg', 15.00, 10.00, 200, 30, '2027-03-31', 2, '1234567890126'),
('Metformin', 'Metformin HCl', 'Cardiovascular', 'Diabetes medication', 'Tablet', '500mg', 10.00, 6.00, 120, 20, '2026-08-31', 3, '1234567890127'),
('Losartan', 'Losartan Potassium', 'Cardiovascular', 'Blood pressure medication', 'Tablet', '50mg', 18.00, 12.00, 90, 15, '2026-11-30', 3, '1234567890128'),
('Salbutamol', 'Albuterol', 'Respiratory', 'Asthma inhaler', 'Inhaler', '100mcg', 25.00, 18.00, 60, 10, '2026-07-31', 4, '1234567890129'),
('Omeprazole', 'Omeprazole', 'Gastrointestinal', 'Acid reflux medication', 'Capsule', '20mg', 20.00, 14.00, 110, 20, '2026-10-31', 1, '1234567890130'),
('Hydrocortisone', 'Hydrocortisone Cream', 'Dermatological', 'Skin inflammation cream', 'Cream', '1%', 8.00, 5.00, 75, 15, '2026-05-31', 4, '1234567890131'),
('Multivitamin', 'Multivitamin Complex', 'Vitamins & Supplements', 'Daily vitamin supplement', 'Tablet', 'Various', 22.00, 15.00, 180, 30, '2027-06-30', 2, '1234567890132'),
('Vitamin C', 'Ascorbic Acid', 'Vitamins & Supplements', 'Immune system support', 'Tablet', '1000mg', 12.00, 8.00, 250, 40, '2027-01-31', 2, '1234567890133'),
('Calcium', 'Calcium Carbonate', 'Vitamins & Supplements', 'Bone health supplement', 'Tablet', '600mg', 15.00, 10.00, 140, 25, '2026-12-31', 2, '1234567890134'),
('Paracetamol Syrup', 'Paracetamol', 'Analgesics', 'Liquid pain reliever for children', 'Syrup', '250mg/5ml', 7.00, 4.50, 90, 20, '2026-08-31', 1, '1234567890135'),
('Azithromycin', 'Azithromycin', 'Antibiotics', 'Macrolide antibiotic', 'Tablet', '500mg', 25.00, 18.00, 70, 15, '2026-09-30', 2, '1234567890136'),
('Diclofenac', 'Diclofenac Sodium', 'Analgesics', 'Strong pain and inflammation relief', 'Tablet', '50mg', 10.00, 7.00, 85, 15, '2026-11-30', 1, '1234567890137'),
('Lisinopril', 'Lisinopril', 'Cardiovascular', 'ACE inhibitor for blood pressure', 'Tablet', '10mg', 16.00, 11.00, 95, 20, '2026-10-31', 3, '1234567890138'),
('Montelukast', 'Montelukast Sodium', 'Respiratory', 'Asthma and allergy prevention', 'Tablet', '10mg', 30.00, 22.00, 55, 10, '2026-07-31', 4, '1234567890139'),
('Ranitidine', 'Ranitidine HCl', 'Gastrointestinal', 'Stomach acid reducer', 'Tablet', '150mg', 12.00, 8.00, 100, 20, '2026-06-30', 1, '1234567890140'),
('Clotrimazole', 'Clotrimazole Cream', 'Dermatological', 'Antifungal cream', 'Cream', '1%', 10.00, 7.00, 65, 15, '2026-09-30', 4, '1234567890141'),
('Timolol', 'Timolol Maleate', 'Eye & Ear', 'Glaucoma eye drops', 'Eye Drops', '0.5%', 35.00, 25.00, 40, 10, '2026-08-31', 3, '1234567890142')
ON CONFLICT DO NOTHING;

-- Insert customers
INSERT INTO customers (name, phone, email, address, loyalty_points, total_purchases, notes) VALUES
('Ahmed Hassan', '555-1001', 'ahmed@email.com', '45 Nile St, Cairo', 150, 1250.00, 'Regular customer'),
('Fatima Ali', '555-1002', 'fatima@email.com', '78 Garden Rd, Giza', 280, 2100.00, 'Prefers generic medicines'),
('Mohamed Omar', '555-1003', 'mohamed@email.com', '32 Main St, Alexandria', 95, 890.00, 'VIP customer'),
('Aisha Mohamed', '555-1004', 'aisha@email.com', '67 Park Ave, Mansoura', 175, 1450.00, NULL),
('Ali Hussein', '555-1005', 'ali@email.com', '89 School St, Suez', 210, 1780.00, 'Business owner'),
('Layla Kamal', '555-1006', 'layla@email.com', '23 Market St, Luxor', 65, 520.00, NULL),
('Youssef Adel', '555-1007', 'youssef@email.com', '56 Beach Rd, Hurghada', 320, 2650.00, 'Prefers brand medicines'),
('Salma Ibrahim', '555-1008', 'salma@email.com', '34 Tower St, Aswan', 120, 980.00, 'Senior citizen discount'),
('Khalid Farouk', '555-1009', 'khalid@email.com', '78 Valley Rd, Minya', 85, 720.00, NULL),
('Nadia Said', '555-1010', 'nadia@email.com', '12 Palace St, Port Said', 195, 1620.00, 'Regular customer')
ON CONFLICT DO NOTHING;

-- Insert sales (sample transactions)
INSERT INTO sales (user_id, customer_name, customer_phone, total_amount, discount, tax, payment_method, status, notes) VALUES
(1, 'Ahmed Hassan', '555-1001', 125.50, 5.00, 11.41, 'cash', 'completed', 'Regular purchase'),
(1, 'Fatima Ali', '555-1002', 89.00, 0, 8.09, 'card', 'completed', NULL),
(2, 'Mohamed Omar', '555-1003', 210.75, 15.00, 17.80, 'cash', 'completed', 'Bulk purchase'),
(1, 'Aisha Mohamed', '555-1004', 56.00, 0, 5.09, 'card', 'completed', NULL),
(2, 'Ali Hussein', '555-1005', 345.00, 25.00, 29.09, 'card', 'completed', 'Large order'),
(1, 'Layla Kamal', '555-1006', 78.50, 0, 7.14, 'cash', 'completed', NULL),
(2, 'Youssef Adel', '555-1007', 189.00, 10.00, 16.27, 'card', 'completed', 'VIP customer'),
(1, 'Salma Ibrahim', '555-1008', 92.00, 5.00, 7.91, 'cash', 'completed', 'Senior discount'),
(2, 'Khalid Farouk', '555-1009', 45.00, 0, 4.09, 'card', 'completed', NULL),
(1, 'Nadia Said', '555-1010', 167.25, 10.00, 14.30, 'cash', 'completed', 'Regular purchase')
ON CONFLICT DO NOTHING;

-- Insert sale items
INSERT INTO sale_items (sale_id, medicine_id, quantity, unit_price, discount, subtotal) VALUES
(1, 1, 5, 5.00, 0, 25.00),
(1, 2, 3, 8.00, 0, 24.00),
(1, 4, 2, 15.00, 0, 30.00),
(1, 11, 3, 12.00, 0, 36.00),
(1, 13, 1, 7.00, 5.00, 2.00),
(2, 3, 2, 12.00, 0, 24.00),
(2, 5, 3, 10.00, 0, 30.00),
(2, 8, 1, 20.00, 0, 20.00),
(2, 12, 1, 15.00, 0, 15.00),
(3, 6, 4, 18.00, 5.00, 67.00),
(3, 7, 3, 25.00, 5.00, 70.00),
(3, 10, 2, 22.00, 0, 44.00),
(3, 14, 1, 25.00, 0, 25.00),
(3, 17, 1, 30.00, 5.00, 25.00),
(4, 1, 4, 5.00, 0, 20.00),
(4, 9, 2, 8.00, 0, 16.00),
(4, 11, 2, 12.00, 0, 24.00),
(5, 3, 5, 12.00, 10.00, 50.00),
(5, 6, 3, 18.00, 5.00, 49.00),
(5, 8, 2, 20.00, 5.00, 35.00),
(5, 10, 4, 22.00, 0, 88.00),
(5, 15, 3, 10.00, 0, 30.00),
(5, 16, 2, 16.00, 5.00, 27.00),
(6, 2, 2, 8.00, 0, 16.00),
(6, 4, 1, 15.00, 0, 15.00),
(6, 5, 2, 10.00, 0, 20.00),
(6, 13, 3, 7.00, 0, 21.00),
(7, 7, 2, 25.00, 0, 50.00),
(7, 10, 3, 22.00, 5.00, 61.00),
(7, 14, 2, 25.00, 0, 50.00),
(7, 18, 2, 12.00, 0, 24.00),
(8, 1, 6, 5.00, 0, 30.00),
(8, 3, 1, 12.00, 0, 12.00),
(8, 5, 2, 10.00, 0, 20.00),
(8, 12, 2, 15.00, 5.00, 25.00),
(9, 1, 3, 5.00, 0, 15.00),
(9, 2, 1, 8.00, 0, 8.00),
(9, 4, 1, 15.00, 0, 15.00),
(9, 11, 1, 12.00, 0, 12.00),
(10, 6, 3, 18.00, 5.00, 49.00),
(10, 8, 2, 20.00, 0, 40.00),
(10, 10, 2, 22.00, 0, 44.00),
(10, 15, 2, 10.00, 0, 20.00),
(10, 19, 1, 10.00, 0, 10.00)
ON CONFLICT DO NOTHING;

-- Insert inventory transactions
INSERT INTO inventory_transactions (medicine_id, transaction_type, quantity, previous_stock, new_stock, reference_id, reference_type, user_id, notes) VALUES
(1, 'purchase', 100, 50, 150, 1, 'purchase_order', 1, 'Initial stock'),
(2, 'purchase', 80, 20, 100, 1, 'purchase_order', 1, 'Initial stock'),
(3, 'purchase', 60, 20, 80, 1, 'purchase_order', 1, 'Initial stock'),
(4, 'sale', 2, 202, 200, 1, 'sale', 1, 'Sale transaction'),
(5, 'sale', 3, 123, 120, 1, 'sale', 1, 'Sale transaction'),
(6, 'purchase', 50, 40, 90, 2, 'purchase_order', 1, 'Restock'),
(7, 'sale', 1, 61, 60, 2, 'sale', 1, 'Sale transaction'),
(8, 'purchase', 70, 40, 110, 2, 'purchase_order', 1, 'Restock'),
(9, 'damaged', 2, 77, 75, NULL, NULL, 1, 'Damaged during handling'),
(10, 'purchase', 100, 80, 180, 3, 'purchase_order', 1, 'Restock'),
(11, 'sale', 3, 253, 250, 3, 'sale', 1, 'Sale transaction'),
(12, 'purchase', 80, 60, 140, 3, 'purchase_order', 1, 'Restock'),
(13, 'sale', 1, 91, 90, 4, 'sale', 1, 'Sale transaction'),
(14, 'purchase', 50, 20, 70, 4, 'purchase_order', 1, 'Restock'),
(15, 'sale', 3, 88, 85, 5, 'sale', 1, 'Sale transaction'),
(16, 'purchase', 60, 35, 95, 5, 'purchase_order', 1, 'Restock'),
(17, 'sale', 1, 56, 55, 6, 'sale', 1, 'Sale transaction'),
(18, 'purchase', 80, 20, 100, 6, 'purchase_order', 1, 'Restock'),
(19, 'sale', 1, 66, 65, 7, 'sale', 1, 'Sale transaction'),
(20, 'purchase', 30, 10, 40, 7, 'purchase_order', 1, 'Restock')
ON CONFLICT DO NOTHING;

-- Insert purchase orders
INSERT INTO purchase_orders (supplier_id, user_id, status, total_amount, expected_date, notes) VALUES
(1, 1, 'received', 450.00, '2026-01-15', 'Initial stock order'),
(2, 1, 'received', 680.00, '2026-01-20', 'Monthly restock'),
(3, 1, 'received', 520.00, '2026-01-25', 'Urgent restock'),
(4, 1, 'pending', 350.00, '2026-02-01', 'Regular order'),
(2, 1, 'pending', 420.00, '2026-02-10', 'Back order')
ON CONFLICT DO NOTHING;

-- Insert purchase order items
INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_cost, received_quantity) VALUES
(1, 1, 100, 3.00, 100),
(1, 2, 80, 5.00, 80),
(1, 13, 50, 4.50, 50),
(2, 3, 60, 8.00, 60),
(2, 4, 100, 10.00, 100),
(2, 11, 80, 8.00, 80),
(3, 5, 50, 6.00, 50),
(3, 6, 50, 12.00, 50),
(3, 12, 60, 10.00, 60),
(4, 7, 30, 18.00, 0),
(4, 19, 50, 7.00, 0),
(5, 8, 50, 14.00, 0),
(5, 14, 30, 18.00, 0)
ON CONFLICT DO NOTHING;

-- Insert inventory adjustments
INSERT INTO inventory_adjustments (user_id, medicine_id, type, quantity, previous_stock, new_stock, reason) VALUES
(1, 9, 'damaged', 2, 77, 75, 'Damaged during warehouse handling'),
(1, 4, 'found', 5, 195, 200, 'Found extra units during stock count'),
(1, 2, 'lost', 3, 103, 100, 'Missing from shelf')
ON CONFLICT DO NOTHING;

-- Insert daily sales summary
INSERT INTO daily_sales_summary (sale_date, total_sales, total_transactions, total_items_sold) VALUES
('2026-04-10', 450.00, 5, 25),
('2026-04-11', 520.00, 6, 30),
('2026-04-12', 380.00, 4, 22),
('2026-04-13', 610.00, 7, 35),
('2026-04-14', 490.00, 5, 28),
('2026-04-15', 550.00, 6, 32)
ON CONFLICT (sale_date) DO NOTHING;

-- Update users with proper roles (if needed)
-- INSERT INTO users (username, password, full_name, email, role) VALUES
-- ('admin', '$2b$10$...', 'System Admin', 'admin@pharmacy.com', 'admin'),
-- ('manager', '$2b$10$...', 'Store Manager', 'manager@pharmacy.com', 'manager'),
-- ('pharmacist', '$2b$10$...', 'Pharmacist', 'pharmacist@pharmacy.com', 'pharmacist')
-- ON CONFLICT (username) DO NOTHING;

SELECT 'Seed data inserted successfully!' as status;