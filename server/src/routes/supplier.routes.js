import express from 'express';
import { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, getSuppliers);
router.get('/:id', verifyToken, getSupplierById);
router.post('/', verifyToken, createSupplier);
router.put('/:id', verifyToken, updateSupplier);
router.delete('/:id', verifyToken, deleteSupplier);

export default router;