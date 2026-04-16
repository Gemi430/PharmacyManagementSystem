import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getAlerts, getAlertCount, markAlertRead, markAllAlertsRead, deleteAlert, generateAlerts, getLowStockMedicines, getExpiringMedicines } from '../controllers/alert.controller.js';

const router = express.Router();

// Public endpoints (for counts)
router.get('/count', getAlertCount);

// Protected endpoints
router.use(verifyToken);

router.get('/', getAlerts);
router.get('/low-stock', getLowStockMedicines);
router.get('/expiring', getExpiringMedicines);
router.post('/generate', generateAlerts);
router.put('/:id/read', markAlertRead);
router.put('/read-all', markAllAlertsRead);
router.delete('/:id', deleteAlert);

export default router;