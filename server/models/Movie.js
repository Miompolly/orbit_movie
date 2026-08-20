import { query } from '../db.js';

const rowToMovie = (row) => {
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title || '',
    description: row.description || '',
    year: row.year || 0,
    rating: Number(row.rating) || 0,
    genre: Array.isArray(row.genre) ? row.genre : [],
    imageUrl: row.image_url || '',
    backdropUrl: row.backdrop_url || '',
    trailerUrl: row.trailer_url || '',
    videoUrl: row.video_url || '',
    duration: row.duration || '',
    cast: Array.isArray(row.cast) ? row.cast : [],
    trending: row.trending || false,
    region: row.region || '',
    price: Number(row.price) || 0,
    isFree: row.is_free || false,
    episodes: Array.isArray(row.episodes) ? row.episodes : [],
    freeEpisodeCount: row.free_episode_count || 0,
    track: row.track || 'original',
    franchise: row.franchise || undefined,
    part: row.part || undefined,
    type: row.type || '',
    release_date: row.release_date || '',
    runtime: row.runtime || undefined,
    overview: row.overview || '',
    vote_average: row.vote_average != null ? Number(row.vote_average) : undefined,
    category: row.category || undefined,
  };
};

export const MovieModel = {
  async all() {
    const { rows } = await query('SELECT * FROM movies ORDER BY id DESC');
    return rows.map(rowToMovie);
  },
  async search(q) {
    if (!q || !q.trim()) return this.all();
    const term = `%${q.trim().toLowerCase()}%`;
    const { rows } = await query(
      `SELECT * FROM movies
       WHERE LOWER(title) LIKE $1
          OR LOWER(description) LIKE $1
          OR LOWER(overview) LIKE $1
          OR LOWER(region) LIKE $1
          OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(genre) AS g WHERE LOWER(g) LIKE $1)
       ORDER BY id DESC`,
      [term]
    );
    return rows.map(rowToMovie);
  },
  async findById(id) {
    const { rows } = await query('SELECT * FROM movies WHERE id = $1', [id]);
    return rowToMovie(rows[0]) || null;
  },
  async create(movie) {
    const id = movie.id ?? Date.now();
    const { rows } = await query(
      `INSERT INTO movies (id, title, description, year, rating, genre, image_url, backdrop_url, trailer_url, video_url, duration, "cast", trending, region, price, is_free, episodes, free_episode_count, track, franchise, part, type, release_date, runtime, overview, vote_average, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) RETURNING *`,
      [
        id, movie.title || '', movie.description || '', movie.year || 0, movie.rating || 0,
        JSON.stringify(movie.genre || []), movie.imageUrl || movie.image_url || '', movie.backdropUrl || movie.backdrop_url || '',
        movie.trailerUrl || '', movie.videoUrl || '', movie.duration || '',
        JSON.stringify(movie.cast || []), movie.trending || false, movie.region || '',
        movie.price || 0, movie.isFree || false, JSON.stringify(movie.episodes || []),
        movie.freeEpisodeCount || 0, movie.track || 'original',
        movie.franchise || null, movie.part || null, movie.type || '',
        movie.release_date || movie.releaseDate || '', movie.runtime || null,
        movie.overview || '', movie.vote_average != null ? movie.vote_average : null,
        movie.category || null,
      ]
    );
    return rowToMovie(rows[0]);
  },
  async update(id, movie) {
    const fields = {};
    if (movie.title != null) fields.title = movie.title;
    if (movie.description != null) fields.description = movie.description;
    if (movie.year != null) fields.year = movie.year;
    if (movie.rating != null) fields.rating = movie.rating;
    if (movie.genre != null) fields.genre = JSON.stringify(movie.genre);
    if (movie.imageUrl != null) fields.image_url = movie.imageUrl;
    if (movie.backdropUrl != null) fields.backdrop_url = movie.backdropUrl;
    if (movie.trailerUrl != null) fields.trailer_url = movie.trailerUrl;
    if (movie.videoUrl != null) fields.video_url = movie.videoUrl;
    if (movie.duration != null) fields.duration = movie.duration;
    if (movie.cast != null) fields.cast = JSON.stringify(movie.cast);
    if (movie.trending != null) fields.trending = movie.trending;
    if (movie.region != null) fields.region = movie.region;
    if (movie.price != null) fields.price = movie.price;
    if (movie.isFree != null) fields.is_free = movie.isFree;
    if (movie.episodes != null) fields.episodes = JSON.stringify(movie.episodes);
    if (movie.freeEpisodeCount != null) fields.free_episode_count = movie.freeEpisodeCount;
    if (movie.track != null) fields.track = movie.track;
    if (movie.franchise !== undefined) fields.franchise = movie.franchise;
    if (movie.part !== undefined) fields.part = movie.part;
    if (movie.type != null) fields.type = movie.type;
    if (movie.release_date != null) fields.release_date = movie.release_date;
    if (movie.releaseDate != null) fields.release_date = movie.releaseDate;
    if (movie.runtime != null) fields.runtime = movie.runtime;
    if (movie.overview != null) fields.overview = movie.overview;
    if (movie.vote_average != null) fields.vote_average = movie.vote_average;
    if (movie.category != null) fields.category = movie.category;

    if (Object.keys(fields).length === 0) return this.findById(id);

    const keys = Object.keys(fields);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = keys.map((k) => fields[k]);
    vals.push(id);

    const { rows } = await query(`UPDATE movies SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`, vals);
    return rowToMovie(rows[0]);
  },
  async remove(id) {
    const { rowCount } = await query('DELETE FROM movies WHERE id = $1', [id]);
    return rowCount > 0;
  },
  async seed(movies) {
    let count = 0;
    for (const m of movies) {
      const exists = await this.findById(m.id);
      if (!exists) {
        await this.create(m);
        count++;
      }
    }
    return count;
  }
};
