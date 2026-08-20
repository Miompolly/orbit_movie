import { User } from '../types';

export const ADMIN_ACCOUNT: Pick<User, 'email'> & { password: string } = {
  email: 'admin@easter.com',
  password: 'admin123'
};
