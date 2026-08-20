import { readDb, updateDb } from './Store.js';

export const ProductModel = {
  all() {
    return readDb().products || [];
  },
  findById(id) {
    return this.all().find((item) => item.id === id) || null;
  },
  save(product) {
    return updateDb((db) => {
      if (!Array.isArray(db.products)) db.products = [];
      const index = db.products.findIndex((item) => item.id === product.id);
      if (index >= 0) {
        db.products[index] = { ...db.products[index], ...product };
      } else {
        db.products.unshift(product);
      }
      return product;
    });
  },
  remove(id) {
    return updateDb((db) => {
      const before = (db.products || []).length;
      db.products = (db.products || []).filter((item) => item.id !== id);
      return before !== db.products.length;
    });
  }
};
