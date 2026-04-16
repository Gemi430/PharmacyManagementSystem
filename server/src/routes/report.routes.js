import express from 'express';
import { getInventoryReport, getSalesReport, getExpiryReport, getSupplierReport, getDashboardStats } from '../controllers/report.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/dashboard', verifyToken, getDashboardStats);
router.get('/inventory', verifyToken, getInventoryReport);
router.get('/sales', verifyToken, getSalesReport);
router.get('/expiry', verifyToken, getExpiryReport);
router.get('/suppliers', verifyToken, getSupplierReport);

export default router;