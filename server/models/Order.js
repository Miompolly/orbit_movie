import { readDb, updateDb } from './Store.js';

export const OrderModel = {
  all() {
    return readDb().orders || [];
  },
  findById(id) {
    return this.all().find((item) => item.id === id) || null;
  },
  forUser(userId) {
    return this.all().filter((item) => item.userId === userId);
  },
  create(order) {
    return updateDb((db) => {
      if (!Array.isArray(db.orders)) db.orders = [];
      db.orders.unshift(order);
      return order;
    });
  },
  update(id, patch) {
    return updateDb((db) => {
      const index = (db.orders || []).findIndex((item) => item.id === id);
      if (index < 0) return null;
      db.orders[index] = { ...db.orders[index], ...patch };
      return db.orders[index];
    });
  },
  attachUser(email, userId) {
    return updateDb((db) => {
      (db.orders || []).forEach((order) => {
        if (order.guest && order.shipping?.email?.toLowerCase() === email.toLowerCase()) {
          order.userId = userId;
          order.guest = false;
        }
      });
    });
  }
};
