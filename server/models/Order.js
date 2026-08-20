import { query } from '../db.js';

const rowToOrder = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    guest: row.guest,
    items: row.items || [],
    shipping: row.shipping || {},
    paymentMethod: row.payment_method,
    payerPhone: row.payer_phone,
    sellerPhone: row.seller_phone,
    sellerName: row.seller_name,
    transactionId: row.transaction_id,
    proofOfPayment: row.proof_of_payment,
    subtotal: Number(row.subtotal) || 0,
    delivery: Number(row.delivery) || 0,
    total: Number(row.total) || 0,
    status: row.status,
    createdAt: row.created_at,
  };
};

export const OrderModel = {
  async all() {
    const { rows } = await query('SELECT * FROM orders ORDER BY created_at DESC');
    return rows.map(rowToOrder);
  },
  async findById(id) {
    const { rows } = await query('SELECT * FROM orders WHERE id = $1', [id]);
    return rowToOrder(rows[0]) || null;
  },
  async forUser(userId) {
    const { rows } = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows.map(rowToOrder);
  },
  async create(order) {
    await query(
      `INSERT INTO orders (id, user_id, guest, items, shipping, payment_method, payer_phone, seller_phone, seller_name, transaction_id, proof_of_payment, subtotal, delivery, total, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        order.id, order.userId || null, order.guest ?? true,
        JSON.stringify(order.items || []), JSON.stringify(order.shipping || {}),
        order.paymentMethod || 'momo', order.payerPhone || '', order.sellerPhone || '',
        order.sellerName || '', order.transactionId || '', order.proofOfPayment || '',
        order.subtotal || 0, order.delivery || 0, order.total || 0, order.status || 'pending',
      ]
    );
    return order;
  },
  async update(id, patch) {
    const sets = [];
    const vals = [];
    let i = 1;
    if (patch.status != null) { sets.push(`status = $${i++}`); vals.push(patch.status); }
    if (patch.userId != null) { sets.push(`user_id = $${i++}`); vals.push(patch.userId); }
    if (patch.guest != null) { sets.push(`guest = $${i++}`); vals.push(patch.guest); }
    if (sets.length === 0) return this.findById(id);
    vals.push(id);
    const { rows } = await query(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    return rowToOrder(rows[0]);
  },
  async attachUser(email, userId) {
    await query(
      `UPDATE orders SET user_id = $1, guest = false
       WHERE guest = true AND LOWER(shipping->>'email') = LOWER($2)`,
      [userId, email]
    );
  }
};
