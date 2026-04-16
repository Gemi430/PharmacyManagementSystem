import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory, getCategoryStats } from '../controllers/category.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getCategories);
router.get('/stats', getCategoryStats);
router.get('/:id', getCategory);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;