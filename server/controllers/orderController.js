import { OrderModel } from '../models/Order.js';
import { DELIVERY_FEE, FREE_DELIVERY_MIN } from '../config/constants.js';

export const OrderController = {
  async list(_req, res) {
    res.json(await OrderModel.all());
  },
  async show(req, res) {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  },
  async create(req, res) {
    const { items = [], shipping = {}, paymentMethod = 'momo', payerPhone = '' } = req.body || {};
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const delivery = subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
    const order = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      userId: req.user?.id || null,
      guest: !req.user,
      items,
      shipping,
      paymentMethod,
      payerPhone,
      sellerPhone: '0788 120 450',
      sellerName: 'EASTER Stream',
      transactionId: '',
      proofOfPayment: '',
      subtotal,
      delivery,
      total: subtotal + delivery,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    res.status(201).json(await OrderModel.create(order));
  },
  async update(req, res) {
    const order = await OrderModel.update(req.params.id, req.body);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  }
};
