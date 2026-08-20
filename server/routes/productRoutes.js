import { Router } from 'express';
import { ProductController } from '../controllers/productController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/', ProductController.list);
router.get('/:id', ProductController.show);
router.post('/', requireAdmin, ProductController.save);
router.put('/:id', requireAdmin, ProductController.save);
router.delete('/:id', requireAdmin, ProductController.remove);
export default router;
