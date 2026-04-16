import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getPurchaseOrders, getPurchaseOrderById, createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } from '../controllers/purchase.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.post('/', createPurchaseOrder);
router.put('/:id/status', updatePurchaseOrderStatus);
router.delete('/:id', deletePurchaseOrder);

export default router;