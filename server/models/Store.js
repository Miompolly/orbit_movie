import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { ADMIN_SEED, PRODUCT_SEED } from '../config/constants.js';
import { buildMovieSeed } from '../config/movieBuilder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'db.json');

const emptyDb = () => ({
  users: [],
  products: [],
  orders: [],
  movies: [],
  comments: [],
  wishlists: [],
  carts: []
});

const seedDb = () => {
  const admin = { ...ADMIN_SEED, password: bcrypt.hashSync(ADMIN_SEED.password, 10) };
  return {
    ...emptyDb(),
    users: [admin],
    products: PRODUCT_SEED,
    movies: buildMovieSeed()
  };
};

const migrate = (db) => {
  let changed = false;
  if (!Array.isArray(db.users)) {
    db.users = [];
    changed = true;
  }
  if (!Array.isArray(db.products) || !db.products.length) {
    db.products = PRODUCT_SEED;
    changed = true;
  }
  if (!Array.isArray(db.movies)) {
    db.movies = [];
    changed = true;
  } else if (db.movies.length > 0 && !db.movies.some((movie) => movie.track)) {
    db.movies = buildMovieSeed();
    changed = true;
  }
  if (!Array.isArray(db.comments)) {
    db.comments = [];
    changed = true;
  }
  if (!Array.isArray(db.wishlists)) {
    db.wishlists = [];
    changed = true;
  }
  if (!Array.isArray(db.orders)) {
    db.orders = [];
    changed = true;
  }
  if (!Array.isArray(db.carts)) {
    db.carts = [];
    changed = true;
  }
  if (!db.users.some((user) => user.email === ADMIN_SEED.email)) {
    db.users.unshift({ ...ADMIN_SEED, password: bcrypt.hashSync(ADMIN_SEED.password, 10) });
    changed = true;
  }
  const OLD_SAMPLE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const trackVideo = (track) =>
    track === 'agasobanuye'
      ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4';
  db.movies.forEach((movie) => {
    const video = trackVideo(movie.track);
    let touched = false;
    if (!movie.trailerUrl || movie.trailerUrl === OLD_SAMPLE) {
      movie.trailerUrl = video;
      touched = true;
    }
    (movie.episodes || []).forEach((ep) => {
      if (!ep.url || ep.url === OLD_SAMPLE) {
        ep.url = video;
        touched = true;
      }
    });
    if (touched) changed = true;
  });
  return changed;
};

const ensureDb = () => {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(seedDb(), null, 2));
    return;
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (migrate(db)) fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

export const readDb = () => {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

export const writeDb = (db) => {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

export const updateDb = (mutator) => {
  const db = readDb();
  const result = mutator(db);
  writeDb(db);
  return result;
};

export const publicUser = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};
