import express from 'express';
import cors from 'cors';
import medicineRoutes from './routes/medicine.routes.js';
import pool from './config/db.js';
import salesRoutes from './routes/sales.routes.js';
import authRoutes from "./routes/auth.routes.js";
import supplierRoutes from './routes/supplier.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;