import { MovieModel } from '../models/Movie.js';
import { buildCategories, buildNarrators, buildMovieSeed } from '../config/movieBuilder.js';

export const MovieController = {
  list(_req, res) {
    res.json(MovieModel.all());
  },
  search(req, res) {
    const q = req.query.q || '';
    res.json(MovieModel.search(q));
  },
  categories(_req, res) {
    res.json(buildCategories(MovieModel.all()));
  },
  narrators(_req, res) {
    res.json(buildNarrators(MovieModel.all()));
  },
  show(req, res) {
    const movie = MovieModel.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    res.json(movie);
  },
  seed(_req, res) {
    const movies = buildMovieSeed();
    const saved = MovieModel.seed(movies);
    const series = saved.filter((item) => item.genre?.includes('Series') || item.genre?.includes('TV Show')).length;
    res.json({
      ok: true,
      movies: saved.length - series,
      series,
      total: saved.length
    });
  },
  create(req, res) {
    res.status(201).json(MovieModel.create(req.body));
  },
  update(req, res) {
    const movie = MovieModel.update(req.params.id, req.body);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    res.json(movie);
  },
  remove(req, res) {
    if (!MovieModel.remove(req.params.id)) return res.status(404).json({ error: 'Movie not found.' });
    res.json({ ok: true });
  }
};
