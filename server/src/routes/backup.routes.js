import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';
import { getBackups, createBackup, restoreBackup, deleteBackup, downloadBackup } from '../controllers/backup.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getBackups);
router.post('/', verifyAdmin, createBackup);
router.post('/:id/restore', verifyAdmin, restoreBackup);
router.delete('/:id', verifyAdmin, deleteBackup);
router.get('/:id/download', downloadBackup);

export default router;