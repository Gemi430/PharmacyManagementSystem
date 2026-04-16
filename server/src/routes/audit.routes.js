import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getAuditLogs, getAuditStats, getRecentActivity, clearOldLogs } from '../controllers/audit.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);
router.get('/recent', getRecentActivity);
router.delete('/clear', clearOldLogs);

export default router;