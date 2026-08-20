import bcrypt from 'bcryptjs';
import { ADMIN_SEED } from '../config/constants.js';
import { signToken } from '../middleware/auth.js';
import { OrderModel } from '../models/Order.js';
import { UserModel } from '../models/User.js';

const publicUser = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};

export const AuthController = {
  async register(req, res) {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Fill in all fields.' });
    }
    const normalized = email.trim().toLowerCase();
    if (normalized === ADMIN_SEED.email) {
      return res.status(400).json({ error: 'This email is reserved for admin.' });
    }
    const existing = await UserModel.findByEmail(normalized);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const user = await UserModel.create({ name, email: normalized, password });
    const token = signToken(user);
    res.status(201).json({ token, user });
  },

  async login(req, res) {
    const { email, password } = req.body || {};
    const account = await UserModel.findByEmail(email);
    if (!account || !bcrypt.compareSync(String(password || ''), account.password)) {
      return res.status(401).json({ error: 'Wrong email or password.' });
    }
    const user = publicUser(account);
    await OrderModel.attachUser(user.email, user.id);
    res.json({ token: signToken(account), user });
  },

  me(req, res) {
    res.json({ user: req.user });
  },

  async updateMe(req, res) {
    if (!req.user) return res.status(401).json({ error: 'Sign in required.' });
    const user = await UserModel.update(req.user.id, {
      name: req.body?.name,
      isVip: req.body?.isVip,
      shipping: req.body?.shipping
    });
    res.json({ user });
  },

  async changePassword(req, res) {
    if (!req.user) return res.status(401).json({ error: 'Sign in required.' });
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    const result = await UserModel.changePassword(req.user.id, currentPassword, newPassword);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ ok: true });
  },

  async users(_req, res) {
    const all = await UserModel.all();
    res.json(all.map(publicUser));
  }
};
