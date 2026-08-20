export const PORT = Number(process.env.PORT) || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'easter-stream-dev-secret';
export const FREE_DELIVERY_MIN = 5;
export const DELIVERY_FEE = 2;

export const SELLER_PAYMENTS = {
  momo: { label: 'MTN MoMo', sellerName: 'EASTER Stream', phone: '0788 120 450' },
  airtel: { label: 'Airtel Money', sellerName: 'EASTER Stream', phone: '0738 120 450' }
};

export const RWANDA_DISTRICTS = [
  'Gasabo', 'Kicukiro', 'Nyarugenge', 'Bugesera', 'Rwamagana', 'Kayonza', 'Nyagatare',
  'Gicumbi', 'Musanze', 'Rubavu', 'Rusizi', 'Huye', 'Muhanga', 'Nyamagabe', 'Karongi'
];

export const ADMIN_SEED = {
  id: 'admin-1',
  name: 'EASTER Admin',
  email: 'admin@easter.com',
  password: 'admin123',
  isVip: true,
  isAdmin: true
};

export const PRODUCT_SEED = [
  { id: 'p1', name: 'EASTER Stream Hoodie', description: 'Black hoodie with yellow play mark.', price: 25, category: 'Merch', imageUrl: 'https://picsum.photos/seed/hoodie/800/600', stock: 40, rating: 5, brand: 'EASTER', onSale: false },
  { id: 'p2', name: 'Agasobanuye T-Shirt', description: 'Classic tee for Abasobanuzi fans.', price: 12, category: 'Merch', imageUrl: 'https://picsum.photos/seed/tshirt/800/600', stock: 80, rating: 4, brand: 'EASTER', onSale: true },
  { id: 'p3', name: 'Movie Poster Pack', description: 'Set of 5 A3 posters from trending titles.', price: 8, category: 'Accessories', imageUrl: 'https://picsum.photos/seed/poster/800/600', stock: 60, rating: 4, brand: 'EASTER', onSale: false },
  { id: 'p4', name: 'USB Film Bundle 64GB', description: 'Offline pack of selected films.', price: 18, category: 'Bundles', imageUrl: 'https://picsum.photos/seed/usb/800/600', stock: 25, rating: 5, brand: 'EASTER', onSale: true },
  { id: 'p5', name: 'Cap — Yellow Mark', description: 'Embroidered cap with the stream logo.', price: 10, category: 'Accessories', imageUrl: 'https://picsum.photos/seed/cap/800/600', stock: 50, rating: 3, brand: 'EASTER', onSale: false },
  { id: 'p6', name: 'VIP Weekend Bundle', description: 'Hoodie + poster pack + 7-day VIP credit.', price: 35, category: 'Bundles', imageUrl: 'https://picsum.photos/seed/bundle/800/600', stock: 15, rating: 5, brand: 'EASTER', onSale: false },
  { id: 'p7', name: 'EASTER Stream Mug', description: 'Ceramic mug with yellow play mark.', price: 9, category: 'Accessories', imageUrl: 'https://picsum.photos/seed/mug/800/600', stock: 70, rating: 4, brand: 'EASTER', onSale: true },
  { id: 'p8', name: 'Narrator Fan Pack', description: 'Stickers and poster of top Abasobanuzi.', price: 6, category: 'Merch', imageUrl: 'https://picsum.photos/seed/fanpack/800/600', stock: 90, rating: 3, brand: 'EASTER', onSale: false },
  { id: 'p9', name: 'Family Weekend Bundle', description: 'Two tees + cap for a weekend watch party.', price: 32, category: 'Bundles', imageUrl: 'https://picsum.photos/seed/family/800/600', stock: 20, rating: 4, brand: 'EASTER', onSale: false },
  { id: 'p10', name: 'Stream Socks', description: 'Yellow and black crew socks.', price: 7, category: 'Merch', imageUrl: 'https://picsum.photos/seed/socks/800/600', stock: 55, rating: 2, brand: 'EASTER', onSale: true },
  { id: 'p11', name: 'Phone Case', description: 'Protective case with play mark.', price: 11, category: 'Accessories', imageUrl: 'https://picsum.photos/seed/case/800/600', stock: 44, rating: 4, brand: 'EASTER', onSale: false },
  { id: 'p12', name: 'Starter Bundle', description: 'Tee + mug + stickers.', price: 22, category: 'Bundles', imageUrl: 'https://picsum.photos/seed/starter/800/600', stock: 18, rating: 5, brand: 'EASTER', onSale: true }
];
