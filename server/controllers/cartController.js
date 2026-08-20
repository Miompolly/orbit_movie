import { CartModel } from '../models/Cart.js';

export const CartController = {
  async show(req, res) {
    const userId = req.user?.id || req.query?.guestId || 'guest';
    res.json(await CartModel.get(userId));
  },
  async save(req, res) {
    const userId = req.user?.id || req.body?.guestId || 'guest';
    res.json(await CartModel.save(userId, req.body.items || {}));
  }
};
