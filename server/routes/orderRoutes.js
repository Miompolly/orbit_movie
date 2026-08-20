import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/', OrderController.list);
router.get('/:id', OrderController.show);
router.post('/', OrderController.create);
router.put('/:id', requireAdmin, OrderController.update);
export default router;
