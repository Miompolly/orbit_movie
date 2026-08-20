import { query } from '../db.js';

const rowToComment = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    movieId: row.movie_id,
    userId: row.user_id,
    userName: row.user_name,
    userIsVip: row.user_is_vip,
    isAdmin: row.is_admin,
    text: row.text,
    timestamp: row.timestamp,
    parentId: row.parent_id,
    likedBy: row.liked_by || [],
    pinned: row.pinned,
    pinnedAt: row.pinned_at,
  };
};

export const CommentModel = {
  async all() {
    const { rows } = await query('SELECT * FROM comments ORDER BY pinned DESC, pinned_at DESC NULLS LAST, timestamp DESC');
    return rows.map(rowToComment);
  },
  async forMovie(movieId) {
    const { rows } = await query(
      'SELECT * FROM comments WHERE movie_id = $1 ORDER BY pinned DESC, pinned_at DESC NULLS LAST, timestamp DESC',
      [String(movieId)]
    );
    return rows.map(rowToComment);
  },
  async findById(id) {
    const { rows } = await query('SELECT * FROM comments WHERE id = $1', [id]);
    return rowToComment(rows[0]) || null;
  },
  async create(fields) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { rows } = await query(
      `INSERT INTO comments (id, movie_id, user_id, user_name, user_is_vip, is_admin, text, parent_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, fields.movieId || null, fields.userId || 'guest', fields.userName || 'Guest',
       fields.userIsVip || false, fields.isAdmin || false, fields.text, fields.parentId || null]
    );
    return rowToComment(rows[0]);
  },
  async toggleLike(id, likerId) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const liked = existing.likedBy || [];
    const idx = liked.indexOf(likerId);
    if (idx >= 0) liked.splice(idx, 1);
    else liked.push(likerId);
    const { rows } = await query('UPDATE comments SET liked_by = $1 WHERE id = $2 RETURNING *', [JSON.stringify(liked), id]);
    return rowToComment(rows[0]);
  },
  async togglePin(id) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const pinned = !existing.pinned;
    const pinnedAt = pinned ? new Date().toISOString() : null;
    const { rows } = await query('UPDATE comments SET pinned = $1, pinned_at = $2 WHERE id = $3 RETURNING *', [pinned, pinnedAt, id]);
    return rowToComment(rows[0]);
  }
};

export const WishlistModel = {
  async forUser(userId) {
    const { rows } = await query('SELECT movie FROM wishlists WHERE user_id = $1', [userId]);
    return rows.map((r) => r.movie);
  },
  async add(userId, movie) {
    await query(
      'INSERT INTO wishlists (user_id, movie_id, movie) VALUES ($1, $2, $3) ON CONFLICT (user_id, movie_id) DO NOTHING',
      [userId, movie.id, JSON.stringify(movie)]
    );
    return this.forUser(userId);
  },
  async remove(userId, movieId) {
    await query('DELETE FROM wishlists WHERE user_id = $1 AND movie_id = $2', [userId, movieId]);
    return this.forUser(userId);
  }
};
