import { Router } from 'express';
import { WishlistController } from '../controllers/commentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAuth, WishlistController.list);
router.post('/', requireAuth, WishlistController.add);
router.delete('/:movieId', requireAuth, WishlistController.remove);
export default router;
