import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';
import { getLocations, getLocation, createLocation, updateLocation, deleteLocation, getLocationStats, transferInventory } from '../controllers/location.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getLocations);
router.get('/:id', getLocation);
router.get('/:id/stats', getLocationStats);
router.post('/', verifyAdmin, createLocation);
router.put('/:id', verifyAdmin, updateLocation);
router.delete('/:id', verifyAdmin, deleteLocation);
router.post('/transfer', verifyAdmin, transferInventory);

export default router;