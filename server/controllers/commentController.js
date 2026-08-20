import { CommentModel, WishlistModel } from '../models/Comment.js';

const authorFrom = (req) => ({
  userId: req.user?.id || req.body?.guestId || 'guest',
  userName: req.user?.name || req.body?.userName || 'Guest',
  userIsVip: Boolean(req.user?.isVip),
  isAdmin: Boolean(req.user?.isAdmin)
});

const likerFrom = (req) => req.user?.id || req.body?.guestId || req.query?.guestId || 'guest';

export const CommentController = {
  async listMovie(req, res) {
    res.json(await CommentModel.forMovie(req.params.id));
  },
  async createMovie(req, res) {
    if (!req.body?.text?.trim()) return res.status(400).json({ error: 'Comment text is required.' });
    const comment = await CommentModel.create({
      movieId: req.params.id,
      parentId: req.body.parentId || null,
      text: req.body.text.trim(),
      ...authorFrom(req)
    });
    res.status(201).json(comment);
  },
  async like(req, res) {
    const comment = await CommentModel.toggleLike(req.params.commentId, String(likerFrom(req)));
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    res.json(comment);
  },
  async pin(req, res) {
    const comment = await CommentModel.togglePin(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    res.json(comment);
  }
};

export const WishlistController = {
  async list(req, res) {
    res.json(await WishlistModel.forUser(req.user.id));
  },
  async add(req, res) {
    if (!req.body?.id) return res.status(400).json({ error: 'Movie is required.' });
    res.json(await WishlistModel.add(req.user.id, req.body));
  },
  async remove(req, res) {
    res.json(await WishlistModel.remove(req.user.id, req.params.movieId));
  }
};
