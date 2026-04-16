import express from 'express';
import cors from 'cors';
import medicineRoutes from './routes/medicine.routes.js';
import pool from './config/db.js';
import salesRoutes from './routes/sales.routes.js';
import authRoutes from "./routes/auth.routes.js";
import supplierRoutes from './routes/supplier.routes.js';
import reportRoutes from './routes/report.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import categoryRoutes from './routes/category.routes.js';
import customerRoutes from './routes/customer.routes.js';
import settingRoutes from './routes/setting.routes.js';
import alertRoutes from './routes/alert.routes.js';
import auditRoutes from './routes/audit.routes.js';
import backupRoutes from './routes/backup.routes.js';
import emailRoutes from './routes/email.routes.js';
import locationRoutes from './routes/location.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/locations', locationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;