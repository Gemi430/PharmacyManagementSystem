import express from 'express';
import { 
  getMedicines, getMedicineById, addMedicine, updateMedicine, 
  deleteMedicine, getCategories, getLowStockMedicines, getExpiringMedicines 
} from '../controllers/medicine.controller.js';

const router = express.Router();

router.get('/', getMedicines);
router.get('/categories', getCategories);
router.get('/low-stock', getLowStockMedicines);
router.get('/expiring', getExpiringMedicines);
router.get('/:id', getMedicineById);
router.post('/', addMedicine);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

export default router;