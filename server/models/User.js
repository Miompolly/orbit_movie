import bcrypt from 'bcryptjs';
import { publicUser, readDb, updateDb } from './Store.js';

export const UserModel = {
  all() {
    return readDb().users;
  },
  findByEmail(email) {
    return this.all().find((user) => user.email.toLowerCase() === String(email || '').trim().toLowerCase()) || null;
  },
  findById(id) {
    return this.all().find((user) => user.id === id) || null;
  },
  create({ name, email, password }) {
    return updateDb((db) => {
      const user = {
        id: `u-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: bcrypt.hashSync(password, 10),
        isVip: false,
        isAdmin: false
      };
      db.users.push(user);
      return publicUser(user);
    });
  },
  update(id, patch) {
    return updateDb((db) => {
      const user = db.users.find((item) => item.id === id);
      if (!user) return null;
      if (patch.name != null) user.name = patch.name;
      if (patch.isVip != null) user.isVip = patch.isVip;
      if (patch.shipping != null) user.shipping = patch.shipping;
      return publicUser(user);
    });
  }
};
