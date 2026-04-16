import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getSales, getSaleById, createSale, getSalesStats, cancelSale } from '../controllers/sales.controller.js';

const router = express.Router();

// All sales routes require authentication
router.use(verifyToken);

router.get('/', getSales);
router.get('/stats', getSalesStats);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.post('/:id/cancel', cancelSale);

export default router;