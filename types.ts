
export interface Episode {
  id: string;
  title: string;
  url: string;
  quality: string;
  isFree: boolean;
  duration?: string;
  season?: number;
}

export interface Movie {
  id: number;
  title: string;
  description: string;
  year: number;
  rating: number;
  genre: string[];
  imageUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  duration: string;
  cast: string[];
  trending?: boolean;
  region?: string;
  price: number;
  isOwned?: boolean;
  episodes?: Episode[];
  freeEpisodeCount?: number;
  isFree?: boolean;
  track?: 'agasobanuye' | 'original';
}

export interface Category {
  id: string;
  title: string;
  movies: Movie[];
}

export enum ChatSender {
  USER = 'user',
  BOT = 'bot'
}

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  relatedMovies?: Movie[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  isVip: boolean;
  isAdmin?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userIsVip: boolean;
  isAdmin?: boolean;
  text: string;
  timestamp: string;
  parentId?: string | null;
  likedBy?: string[];
  pinned?: boolean;
  pinnedAt?: string | null;
  movieId?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  rating?: number;
  onSale?: boolean;
  brand?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  qty: number;
}

export type PaymentMethod = 'momo' | 'airtel';
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'delivered';

export interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  district: string;
  address: string;
  notes: string;
}

export interface ShopOrder {
  id: string;
  userId: string | null;
  guest: boolean;
  items: OrderItem[];
  shipping: ShippingInfo;
  paymentMethod: PaymentMethod;
  payerPhone: string;
  sellerPhone: string;
  sellerName: string;
  transactionId: string;
  proofOfPayment: string;
  subtotal: number;
  delivery: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}
