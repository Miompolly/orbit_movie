import { readDb, updateDb } from './Store.js';

const withDefaults = (comment) => ({
  parentId: null,
  likedBy: [],
  isAdmin: false,
  pinned: false,
  pinnedAt: null,
  ...comment,
  likedBy: Array.isArray(comment.likedBy) ? comment.likedBy : [],
  pinned: Boolean(comment.pinned)
});

const byPinThenRecent = (a, b) => {
  if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
  const pinA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
  const pinB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
  if (pinA !== pinB) return pinB - pinA;
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
};

export const CommentModel = {
  all() {
    return readDb().comments.map(withDefaults);
  },
  forMovie(movieId) {
    return this.all().filter((item) => String(item.movieId) === String(movieId)).sort(byPinThenRecent);
  },
  findById(id) {
    return this.all().find((item) => item.id === id) || null;
  },
  create(fields) {
    return updateDb((db) => {
      const next = withDefaults({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        movieId: fields.movieId || null,
        parentId: fields.parentId || null,
        userId: fields.userId || 'guest',
        userName: fields.userName || 'Guest',
        userIsVip: Boolean(fields.userIsVip),
        isAdmin: Boolean(fields.isAdmin),
        text: fields.text,
        timestamp: new Date().toISOString(),
        likedBy: [],
        pinned: false,
        pinnedAt: null
      });
      db.comments.unshift(next);
      return next;
    });
  },
  toggleLike(id, likerId) {
    return updateDb((db) => {
      const comment = db.comments.find((item) => item.id === id);
      if (!comment) return null;
      if (!Array.isArray(comment.likedBy)) comment.likedBy = [];
      const index = comment.likedBy.indexOf(likerId);
      if (index >= 0) comment.likedBy.splice(index, 1);
      else comment.likedBy.push(likerId);
      return withDefaults(comment);
    });
  },
  togglePin(id) {
    return updateDb((db) => {
      const comment = db.comments.find((item) => item.id === id);
      if (!comment) return null;
      comment.pinned = !comment.pinned;
      comment.pinnedAt = comment.pinned ? new Date().toISOString() : null;
      return withDefaults(comment);
    });
  }
};

export const WishlistModel = {
  forUser(userId) {
    return readDb().wishlists.filter((item) => item.userId === userId).map((item) => item.movie);
  },
  add(userId, movie) {
    return updateDb((db) => {
      if (!db.wishlists.some((item) => item.userId === userId && item.movieId === movie.id)) {
        db.wishlists.push({ userId, movieId: movie.id, movie });
      }
      return db.wishlists.filter((item) => item.userId === userId).map((item) => item.movie);
    });
  },
  remove(userId, movieId) {
    return updateDb((db) => {
      db.wishlists = db.wishlists.filter(
        (item) => !(item.userId === userId && String(item.movieId) === String(movieId))
      );
      return db.wishlists.filter((item) => item.userId === userId).map((item) => item.movie);
    });
  }
};
