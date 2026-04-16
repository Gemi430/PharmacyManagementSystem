import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';
import { getEmailTemplates, getEmailTemplate, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, sendEmail, getEmailQueue } from '../controllers/email.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/templates', getEmailTemplates);
router.get('/templates/:id', getEmailTemplate);
router.post('/templates', verifyAdmin, createEmailTemplate);
router.put('/templates/:id', verifyAdmin, updateEmailTemplate);
router.delete('/templates/:id', verifyAdmin, deleteEmailTemplate);

router.post('/send', sendEmail);
router.get('/queue', getEmailQueue);

export default router;