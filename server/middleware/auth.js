import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import { UserModel } from '../models/User.js';

export const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, isAdmin: Boolean(user.isAdmin) }, JWT_SECRET, { expiresIn: '7d' });

const stripPassword = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};

export const optionalAuth = async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(payload.id);
    req.user = stripPassword(user);
  } catch {
    req.user = null;
  }
  next();
};

export const requireAuth = (req, res, next) => {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Sign in required.' });
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin only.' });
    next();
  });
};
