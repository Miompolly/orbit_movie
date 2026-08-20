import bcrypt from 'bcryptjs';
import { ADMIN_SEED } from '../config/constants.js';
import { signToken } from '../middleware/auth.js';
import { OrderModel } from '../models/Order.js';
import { publicUser } from '../models/Store.js';
import { UserModel } from '../models/User.js';

export const AuthController = {
  register(req, res) {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Fill in all fields.' });
    }
    const normalized = email.trim().toLowerCase();
    if (normalized === ADMIN_SEED.email) {
      return res.status(400).json({ error: 'This email is reserved for admin.' });
    }
    if (UserModel.findByEmail(normalized)) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const user = UserModel.create({ name, email: normalized, password });
    const token = signToken(user);
    res.status(201).json({ token, user });
  },

  login(req, res) {
    const { email, password } = req.body || {};
    const account = UserModel.findByEmail(email);
    if (!account || !bcrypt.compareSync(String(password || ''), account.password)) {
      return res.status(401).json({ error: 'Wrong email or password.' });
    }
    const user = publicUser(account);
    OrderModel.attachUser(user.email, user.id);
    res.json({ token: signToken(account), user });
  },

  me(req, res) {
    res.json({ user: req.user });
  },

  updateMe(req, res) {
    if (!req.user) return res.status(401).json({ error: 'Sign in required.' });
    const user = UserModel.update(req.user.id, {
      name: req.body?.name,
      isVip: req.body?.isVip,
      shipping: req.body?.shipping
    });
    res.json({ user });
  },

  users(_req, res) {
    res.json(UserModel.all().map(publicUser));
  }
};
