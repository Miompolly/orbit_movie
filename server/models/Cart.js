import { query } from '../db.js';

export const CartModel = {
  async get(userId) {
    const { rows } = await query('SELECT items FROM carts WHERE user_id = $1', [userId]);
    return rows[0]?.items || {};
  },
  async save(userId, items) {
    await query(
      'INSERT INTO carts (user_id, items) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET items = $2',
      [userId, JSON.stringify(items)]
    );
    return items;
  }
};
