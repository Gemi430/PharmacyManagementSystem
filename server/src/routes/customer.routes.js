import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, addLoyaltyPoints, getCustomerStats } from '../controllers/customer.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getCustomers);
router.get('/stats', getCustomerStats);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.post('/:id/loyalty', addLoyaltyPoints);

export default router;