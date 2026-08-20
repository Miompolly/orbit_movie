import { readDb, updateDb } from './Store.js';

export const CartModel = {
  get(userId) {
    const db = readDb();
    const cart = (db.carts || []).find((item) => item.userId === userId);
    return cart ? cart.items : {};
  },
  save(userId, items) {
    return updateDb((db) => {
      if (!Array.isArray(db.carts)) db.carts = [];
      const index = db.carts.findIndex((item) => item.userId === userId);
      if (index >= 0) {
        db.carts[index].items = items;
      } else {
        db.carts.push({ userId, items });
      }
      return items;
    });
  }
};
