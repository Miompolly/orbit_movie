import { Router } from 'express';
import { ContactController } from '../controllers/contactController.js';
import { contactLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.post('/', contactLimiter, ContactController.send);
export default router;
