import express from 'express';
import { getMedicines, addMedicine } from '../controllers/medicine.controller.js';

const router = express.Router();

router.get('/', getMedicines);
router.post('/', addMedicine);

export default router;