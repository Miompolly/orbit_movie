import { Movie, Category, Episode } from '../types';
import { CATALOG, CatalogEntry, NARRATORS, ROW_TITLES } from './catalog';
import { getToken } from './apiClient';

const PLACEHOLDER_BASE = 'https://picsum.photos';
const SAMPLE_TRAILER = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const yearFromPosted = (posted: string) => {
  if (/year/i.test(posted)) return 2024;
  if (/month/i.test(posted) && !/last month/i.test(posted)) return 2025;
  return 2026;
};

const makeEpisodes = (id: number, entry: CatalogEntry): Episode[] => {
  const kind = entry.kind || 'movie';
  const count = Math.max(1, entry.count || (kind === 'movie' ? 1 : 1));
  if (kind === 'season') {
    return Array.from({ length: count }, (_, i) => ({
      id: `ep-${id}-s1-${i + 1}`,
      title: `Episode ${i + 1}`,
      url: SAMPLE_TRAILER,
      quality: '1080p',
      isFree: true,
      duration: '45m',
      season: 1
    }));
  }
  if (kind === 'parts') {
    return Array.from({ length: count }, (_, i) => ({
      id: `ep-${id}-p${i + 1}`,
      title: `Part ${i + 1}`,
      url: SAMPLE_TRAILER,
      quality: '1080p',
      isFree: true,
      duration: '90m',
      season: 1
    }));
  }
  return [
    {
      id: `main-${id}`,
      title: 'Full Movie',
      url: SAMPLE_TRAILER,
      quality: '1080p',
      isFree: true,
      duration: '120m',
      season: 1
    }
  ];
};

const toMovie = (entry: CatalogEntry, id: number): Movie => {
  const episodes = makeEpisodes(id, entry);
  const isSeason = entry.kind === 'season';
  const genre = [entry.genre];
  if (entry.genre === 'Romance') genre.push('Romantic');
  if (entry.genre === 'Sci-Fi') genre.push('Scifi');
  if (isSeason) genre.push('Series', 'TV Show');

  const duration =
    entry.kind === 'season'
      ? `${episodes.length} Episodes`
      : entry.kind === 'parts'
        ? `${episodes.length} Parts`
        : '120 min';

  return {
    id,
    title: entry.title,
    description: `${entry.title} narrated by ${entry.narrator}.`,
    year: yearFromPosted(entry.posted),
    rating: Number((7.4 + ((id * 17) % 21) / 10).toFixed(1)),
    genre,
    imageUrl: `${PLACEHOLDER_BASE}/300/450?random=${id}`,
    backdropUrl: `${PLACEHOLDER_BASE}/1280/720?random=${id}`,
    trailerUrl: SAMPLE_TRAILER,
    duration,
    cast: [entry.narrator],
    trending: Boolean(entry.trending) || ROW_TITLES.trending.includes(entry.title),
    region: entry.narrator,
    price: 0,
    freeEpisodeCount: 100,
    isFree: true,
    episodes
  };
};

export const ALL_MOVIES: Movie[] = CATALOG.map((entry, index) => toMovie(entry, 100 + index));

const pickByTitles = (movies: Movie[], titles: string[]) =>
  titles
    .map((title) => movies.find((m) => m.title === title))
    .filter((m): m is Movie => Boolean(m));

const byGenre = (movies: Movie[], genre: string) =>
  movies.filter((m) =>
    m.genre?.some((g) => g.toLowerCase() === genre.toLowerCase() || (genre === 'Sci-Fi' && /sci-?fi/i.test(g)))
  );

export const buildCategories = (movies: Movie[]): Category[] => [
  { id: 'recent', title: 'Recent', movies: pickByTitles(movies, ROW_TITLES.recent) },
  { id: 'top10', title: 'Top 10 This Week', movies: pickByTitles(movies, ROW_TITLES.top10) },
  { id: 'trending', title: 'Trending', movies: pickByTitles(movies, ROW_TITLES.trending) },
  { id: 'seasons', title: 'Seasons', movies: pickByTitles(movies, ROW_TITLES.seasons) },
  { id: 'action', title: 'Action', movies: byGenre(movies, 'Action') },
  { id: 'romance', title: 'Romance', movies: byGenre(movies, 'Romance') },
  { id: 'horror', title: 'Horror', movies: byGenre(movies, 'Horror') },
  { id: 'indian', title: 'Indian', movies: byGenre(movies, 'Indian') },
  { id: 'cartoon', title: 'Cartoon', movies: byGenre(movies, 'Cartoon') },
  { id: 'scifi', title: 'Scifi', movies: byGenre(movies, 'Sci-Fi') },
  { id: 'drama', title: 'Drama', movies: byGenre(movies, 'Drama') },
  { id: 'comedy', title: 'Comedy', movies: byGenre(movies, 'Comedy') },
  { id: 'others', title: 'Others', movies: byGenre(movies, 'Others') }
];

export const CATEGORIES: Category[] = buildCategories(ALL_MOVIES);
export const TRENDING_MOVIES = pickByTitles(ALL_MOVIES, ROW_TITLES.trending);
export const ACTION_MOVIES = byGenre(ALL_MOVIES, 'Action');
export const ROMANCE_MOVIES = byGenre(ALL_MOVIES, 'Romance');
export const MUSIC_VIDEOS = ALL_MOVIES.filter((m) => m.genre?.includes('Music'));
export { NARRATORS };

export const getMovieById = (id: number): Movie | undefined => ALL_MOVIES.find((m) => m.id === id);

export const searchMovies = (query: string): Movie[] => {
  const lower = query.toLowerCase();
  return ALL_MOVIES.filter(
    (m) =>
      m.title.toLowerCase().includes(lower) ||
      m.genre?.some((g) => g.toLowerCase().includes(lower)) ||
      (m.region && m.region.toLowerCase().includes(lower))
  );
};

const API_URL = '/api';

export const api = {
  fetchMovies: async (): Promise<Movie[]> => {
    const res = await fetch(`${API_URL}/movies`);
    if (!res.ok) throw new Error('Failed to fetch movies');
    return res.json();
  },

  fetchCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${API_URL}/movies/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  fetchMovie: async (id: number): Promise<Movie> => {
    const res = await fetch(`${API_URL}/movies/${id}`);
    if (!res.ok) throw new Error('Failed to fetch movie');
    return res.json();
  },

  createMovie: async (movie: Movie): Promise<Movie> => {
    const res = await fetch(`${API_URL}/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movie)
    });
    if (!res.ok) throw new Error('Failed to create');
    return res.json();
  },

  updateMovie: async (movie: Movie): Promise<Movie> => {
    const token = getToken();
    const res = await fetch(`${API_URL}/movies/${movie.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(movie)
    });
    if (!res.ok) throw new Error('Failed to update');
    return res.json();
  },

  deleteMovie: async (id: number): Promise<void> => {
    const token = getToken();
    const res = await fetch(`${API_URL}/movies/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) throw new Error('Failed to delete');
  }
};
