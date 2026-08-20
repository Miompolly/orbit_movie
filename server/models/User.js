import { query } from '../db.js';
import bcrypt from 'bcryptjs';
import { ADMIN_SEED } from '../config/constants.js';

const rowToUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    isVip: row.is_vip,
    isAdmin: row.is_admin,
    shipping: row.shipping || null,
  };
};

const publicUser = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};

export const UserModel = {
  async all() {
    const { rows } = await query('SELECT * FROM users');
    return rows.map(rowToUser);
  },
  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return rowToUser(rows[0]) || null;
  },
  async findById(id) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rowToUser(rows[0]) || null;
  },
  async create({ name, email, password }) {
    const id = `u-${Date.now()}`;
    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await query(
      'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name.trim(), email.trim().toLowerCase(), hash]
    );
    return publicUser(rowToUser(rows[0]));
  },
  async update(id, patch) {
    const sets = [];
    const vals = [];
    let i = 1;
    if (patch.name != null) { sets.push(`name = $${i++}`); vals.push(patch.name); }
    if (patch.isVip != null) { sets.push(`is_vip = $${i++}`); vals.push(patch.isVip); }
    if (patch.isAdmin != null) { sets.push(`is_admin = $${i++}`); vals.push(patch.isAdmin); }
    if (patch.shipping != null) { sets.push(`shipping = $${i++}`); vals.push(JSON.stringify(patch.shipping)); }
    if (sets.length === 0) return null;
    vals.push(id);
    const { rows } = await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    return publicUser(rowToUser(rows[0]));
  },
  async changePassword(id, oldPassword, newPassword) {
    const user = await this.findById(id);
    if (!user) return { error: 'User not found.' };
    if (!bcrypt.compareSync(String(oldPassword || ''), user.password)) {
      return { error: 'Current password is incorrect.' };
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hash, id]);
    return { ok: true };
  },
  async ensureAdmin() {
    const existing = await this.findByEmail(ADMIN_SEED.email);
    if (!existing) {
      const hash = bcrypt.hashSync(ADMIN_SEED.password, 10);
      await query(
        'INSERT INTO users (id, name, email, password, is_vip, is_admin) VALUES ($1, $2, $3, $4, true, true) ON CONFLICT (email) DO NOTHING',
        [ADMIN_SEED.id, ADMIN_SEED.name, ADMIN_SEED.email, hash]
      );
    }
  }
};
