import { readDb, updateDb } from './Store.js';

export const MovieModel = {
  all() {
    return readDb().movies;
  },
  findById(id) {
    return this.all().find((item) => String(item.id) === String(id)) || null;
  },
  seed(movies) {
    return updateDb((db) => {
      const existingIds = new Set(db.movies.map((m) => m.id));
      const newMovies = movies.filter((m) => !existingIds.has(m.id));
      db.movies = [...db.movies, ...newMovies];
      return db.movies;
    });
  },
  create(movie) {
    return updateDb((db) => {
      const next = { ...movie, id: movie.id ?? Date.now(), genre: Array.isArray(movie.genre) ? movie.genre : [] };
      db.movies.unshift(next);
      return next;
    });
  },
  update(id, movie) {
    return updateDb((db) => {
      const index = db.movies.findIndex((item) => String(item.id) === String(id));
      if (index < 0) return null;
      db.movies[index] = { ...db.movies[index], ...movie, id: db.movies[index].id };
      return db.movies[index];
    });
  },
  remove(id) {
    return updateDb((db) => {
      const before = db.movies.length;
      db.movies = db.movies.filter((item) => String(item.id) !== String(id));
      return before !== db.movies.length;
    });
  }
};
