import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getSettings, getSetting, updateSetting, upsertSetting, getDashboardSettings } from '../controllers/setting.controller.js';

const router = express.Router();

// Public endpoints (for dashboard settings)
router.get('/dashboard', getDashboardSettings);

// Protected endpoints
router.use(verifyToken);

router.get('/', getSettings);
router.get('/:key', getSetting);
router.put('/:key', updateSetting);
router.post('/', upsertSetting);

export default router;