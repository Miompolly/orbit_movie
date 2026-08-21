declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const ga = {
  event(name: string, params?: Record<string, unknown>) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  },

  movieView(movie: { id: number | string; title: string; genre?: string[] }) {
    this.event('view_item', {
      item_id: movie.id,
      item_name: movie.title,
      item_category: movie.genre?.[0] || 'Movie',
    });
  },

  movieSelect(movie: { id: number | string; title: string }) {
    this.event('select_item', {
      item_id: movie.id,
      item_name: movie.title,
    });
  },

  moviePlay(movie: { id: number | string; title: string }) {
    this.event('play_movie', {
      item_id: movie.id,
      item_name: movie.title,
    });
  },

  search(query: string, resultCount?: number) {
    this.event('search', {
      search_term: query,
      ...(resultCount != null ? { result_count: resultCount } : {}),
    });
  },

  login(method: string = 'email') {
    this.event('login', { method });
  },

  register(method: string = 'email') {
    this.event('sign_up', { method });
  },

  addToWishlist(movie: { id: number | string; title: string }) {
    this.event('add_to_wishlist', {
      item_id: movie.id,
      item_name: movie.title,
    });
  },

  removeFromWishlist(movie: { id: number | string; title: string }) {
    this.event('remove_from_wishlist', {
      item_id: movie.id,
      item_name: movie.title,
    });
  },

  addToCart(product: { id: string; name: string; price: number }, qty: number = 1) {
    this.event('add_to_cart', {
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: qty }],
    });
  },

  purchase(orderId: string, total: number, items: { id: string; name: string; price: number; qty: number }[]) {
    this.event('purchase', {
      transaction_id: orderId,
      value: total,
      currency: 'USD',
      items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })),
    });
  },

  comment(movieId: string | number) {
    this.event('post_comment', { item_id: movieId });
  },

  share(movieId: string | number, method: string = 'link') {
    this.event('share', { method, content_type: 'movie', item_id: movieId });
  },

  vipSubscribe() {
    this.event('vip_subscribe');
  },

  filterBy(filter: string) {
    this.event('filter', { filter_name: filter });
  },

  trackBy(track: string) {
    this.event('select_track', { track_name: track });
  },
};
