import { ProductModel } from '../models/Product.js';

export const ProductController = {
  async list(_req, res) {
    res.json(await ProductModel.all());
  },
  async show(req, res) {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  },
  async save(req, res) {
    const product = { ...req.body, id: req.params.id || req.body.id || `p${Date.now()}` };
    res.json(await ProductModel.save(product));
  },
  async remove(req, res) {
    const removed = await ProductModel.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Product not found.' });
    res.json({ ok: true });
  }
};
