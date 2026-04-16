import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getInventoryAdjustments, createInventoryAdjustment, getAdjustmentSummary } from '../controllers/inventory.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getInventoryAdjustments);
router.get('/summary', getAdjustmentSummary);
router.post('/', createInventoryAdjustment);

export default router;