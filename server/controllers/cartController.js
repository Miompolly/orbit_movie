import { CartModel } from '../models/Cart.js';

export const CartController = {
  show(req, res) {
    const userId = req.user?.id || req.query?.guestId || 'guest';
    res.json(CartModel.get(userId));
  },
  save(req, res) {
    const userId = req.user?.id || req.body?.guestId || 'guest';
    res.json(CartModel.save(userId, req.body.items || {}));
  }
};
