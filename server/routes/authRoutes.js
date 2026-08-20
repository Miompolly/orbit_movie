import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.get('/me', requireAuth, AuthController.me);
router.put('/me', requireAuth, AuthController.updateMe);
router.put('/password', requireAuth, AuthController.changePassword);
router.get('/users', requireAuth, requireAdmin, AuthController.users);
export default router;
