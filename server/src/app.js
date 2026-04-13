import express from 'express';
import cors from 'cors';
import medicineRoutes from './routes/medicine.routes.js';
import pool from './config/db.js';
import salesRoutes from './routes/sales.routes.js';


const app = express();

app.use(cors());
app.use(express.json());


// routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/sales', salesRoutes);


export default app;