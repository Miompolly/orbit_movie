import { Comment, Movie, Product, ShopOrder, User } from '../types';
import { request, setToken, guestId } from './apiClient';

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const data = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    return data.user;
  },
  register: async (name: string, email: string, password: string) => {
    const data = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    setToken(data.token);
    return data.user;
  },
  me: () => request<{ user: User }>('/auth/me').then((data) => data.user),
  users: () => request<User[]>('/auth/users'),
  updateMe: (patch: Partial<User>) =>
    request<{ user: User }>('/auth/me', { method: 'PUT', body: JSON.stringify(patch) }).then((data) => data.user),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),

  // Products (admin)
  products: () => request<Product[]>('/products'),
  product: (id: string) => request<Product>(`/products/${id}`),
  saveProduct: (product: Product) =>
    request<Product>(product.id ? `/products/${product.id}` : '/products', {
      method: product.id ? 'PUT' : 'POST',
      body: JSON.stringify(product)
    }),
  deleteProduct: (id: string) => request<{ ok: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  // Orders (admin)
  orders: () => request<ShopOrder[]>('/orders'),
  order: (id: string) => request<ShopOrder>(`/orders/${id}`),
  placeOrder: (draft: any) => request<ShopOrder>('/orders', { method: 'POST', body: JSON.stringify(draft) }),
  updateOrder: (id: string, patch: Partial<ShopOrder>) =>
    request<ShopOrder>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),

  // Movie comments
  movieComments: (movieId: string | number) => request<Comment[]>(`/movies/${movieId}/comments`),
  allComments: () => request<Comment[]>('/comments'),
  postMovieComment: (movieId: string | number, text: string, parentId?: string) =>
    request<Comment>(`/movies/${movieId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, parentId, guestId: guestId() })
    }),
  likeMovieComment: (movieId: string | number, commentId: string) =>
    request<Comment>(`/movies/${movieId}/comments/${commentId}/like`, {
      method: 'POST',
      body: JSON.stringify({ guestId: guestId() })
    }),
  pinMovieComment: (movieId: string | number, commentId: string) =>
    request<Comment>(`/movies/${movieId}/comments/${commentId}/pin`, { method: 'POST' }),

  // Wishlist
  wishlist: () => request<Movie[]>('/wishlist'),
  addWishlist: (movie: Movie) => request<Movie[]>('/wishlist', { method: 'POST', body: JSON.stringify(movie) }),
  removeWishlist: (movieId: number) => request<Movie[]>(`/wishlist/${movieId}`, { method: 'DELETE' }),

  // Cart
  cart: () => request<Record<string, number>>('/cart'),
  saveCart: (items: Record<string, number>) =>
    request<Record<string, number>>('/cart', { method: 'PUT', body: JSON.stringify({ items }) }),

  // Config
  config: () => request<{ districts: string[]; adminEmail: string }>('/config'),
  categories: () => request<import('../types').Category[]>('/movies/categories'),
  searchMovies: (query: string) => request<Movie[]>(`/movies/search?q=${encodeURIComponent(query)}`),
  narrators: () => request<{ name: string; count: number }[]>('/movies/narrators'),
  movie: (id: number) => request<Movie>(`/movies/${id}`),
  createMovie: (movie: Partial<Movie>) =>
    request<Movie>('/movies', { method: 'POST', body: JSON.stringify(movie) }),

  // Video upload
  uploadVideo: async (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    const data = await request<{ url: string; filename: string; size: number; originalName: string }>(
      '/upload/video',
      { method: 'POST', body: formData }
    );
    return data;
  },

  // Image upload
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const data = await request<{ url: string; filename: string; size: number; originalName: string }>(
      '/upload/image',
      { method: 'POST', body: formData }
    );
    return data;
  },

  // Contact
  sendContact: (payload: { name: string; email: string; message: string }) =>
    request<{ ok: boolean }>('/contact', { method: 'POST', body: JSON.stringify(payload) }),
};
