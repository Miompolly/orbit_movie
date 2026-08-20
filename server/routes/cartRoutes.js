import { Router } from 'express';
import { CartController } from '../controllers/cartController.js';

const router = Router();
router.get('/', CartController.show);
router.put('/', CartController.save);
export default router;
