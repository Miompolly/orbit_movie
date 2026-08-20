import { ProductModel } from '../models/Product.js';

export const ProductController = {
  list(_req, res) {
    res.json(ProductModel.all());
  },
  show(req, res) {
    const product = ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  },
  save(req, res) {
    const product = { ...req.body, id: req.params.id || req.body.id || `p${Date.now()}` };
    res.json(ProductModel.save(product));
  },
  remove(req, res) {
    if (!ProductModel.remove(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
    res.json({ ok: true });
  }
};
