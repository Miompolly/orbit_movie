import { query } from '../db.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_vip BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  shipping JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movies (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  year INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  genre JSONB DEFAULT '[]',
  image_url TEXT DEFAULT '',
  backdrop_url TEXT DEFAULT '',
  trailer_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  "cast" JSONB DEFAULT '[]',
  trending BOOLEAN DEFAULT false,
  region TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  episodes JSONB DEFAULT '[]',
  free_episode_count INTEGER DEFAULT 0,
  track TEXT DEFAULT 'original',
  franchise TEXT,
  part INTEGER,
  type TEXT DEFAULT '',
  release_date TEXT DEFAULT '',
  runtime INTEGER,
  overview TEXT DEFAULT '',
  vote_average NUMERIC,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  category TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  stock INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  on_sale BOOLEAN DEFAULT false,
  brand TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest BOOLEAN DEFAULT true,
  items JSONB DEFAULT '[]',
  shipping JSONB DEFAULT '{}',
  payment_method TEXT DEFAULT 'momo',
  payer_phone TEXT DEFAULT '',
  seller_phone TEXT DEFAULT '',
  seller_name TEXT DEFAULT '',
  transaction_id TEXT DEFAULT '',
  proof_of_payment TEXT DEFAULT '',
  subtotal NUMERIC DEFAULT 0,
  delivery NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  movie_id TEXT,
  user_id TEXT DEFAULT 'guest',
  user_name TEXT DEFAULT 'Guest',
  user_is_vip BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  text TEXT NOT NULL,
  parent_id TEXT,
  liked_by JSONB DEFAULT '[]',
  pinned BOOLEAN DEFAULT false,
  pinned_at TIMESTAMPTZ,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  movie_id BIGINT NOT NULL,
  movie JSONB NOT NULL,
  UNIQUE(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS carts (
  user_id TEXT PRIMARY KEY,
  items JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies USING GIN (genre);
CREATE INDEX IF NOT EXISTS idx_movies_franchise ON movies (franchise);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_movie ON comments (movie_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists (user_id);
`;

export async function migrate() {
  await query(SCHEMA);
  console.log('PostgreSQL schema ready');
}

export default migrate;
