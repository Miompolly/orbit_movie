import { MovieModel } from '../models/Movie.js';
import { buildCategories, buildNarrators, buildMovieSeed } from '../config/movieBuilder.js';

export const MovieController = {
  async list(_req, res) {
    res.json(await MovieModel.all());
  },
  async search(req, res) {
    const q = req.query.q || '';
    res.json(await MovieModel.search(q));
  },
  async categories(_req, res) {
    const movies = await MovieModel.all();
    res.json(buildCategories(movies));
  },
  async narrators(_req, res) {
    const movies = await MovieModel.all();
    res.json(buildNarrators(movies));
  },
  async show(req, res) {
    const movie = await MovieModel.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    res.json(movie);
  },
  async seed(_req, res) {
    const movies = buildMovieSeed();
    const saved = await MovieModel.seed(movies);
    const allMovies = await MovieModel.all();
    const series = allMovies.filter((item) => item.genre?.includes('Series') || item.genre?.includes('TV Show')).length;
    res.json({
      ok: true,
      movies: saved,
      series,
      total: allMovies.length
    });
  },
  async create(req, res) {
    const movie = await MovieModel.create(req.body);
    res.status(201).json(movie);
  },
  async update(req, res) {
    const movie = await MovieModel.update(req.params.id, req.body);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    res.json(movie);
  },
  async remove(req, res) {
    const removed = await MovieModel.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Movie not found.' });
    res.json({ ok: true });
  }
};
