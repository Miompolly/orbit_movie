import { CATALOG, ROW_TITLES } from './catalog.js';

const VIDEO_BY_TRACK = {
  original: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  agasobanuye: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
};

const videoFor = (track) => VIDEO_BY_TRACK[track] || VIDEO_BY_TRACK.original;

const makeEpisodes = (id, entry) => {
  const kind = entry.kind || 'movie';
  const count = Math.max(1, entry.count || (kind === 'season' ? 8 : 1));
  const url = videoFor(entry.track);
  if (kind === 'season') {
    return Array.from({ length: count }, (_, i) => ({
      id: `ep-${id}-s1-${i + 1}`,
      title: `Episode ${i + 1}`,
      url,
      quality: '1080p',
      isFree: true,
      duration: '45m',
      season: 1
    }));
  }
  return [{
    id: `main-${id}`,
    title: 'Full Movie',
    url,
    quality: '1080p',
    isFree: true,
    duration: entry.duration || '120m',
    season: 1
  }];
};

const toMovie = (entry, id) => {
  const episodes = makeEpisodes(id, entry);
  const isSeason = entry.kind === 'season';
  const genre = [entry.genre];
  if (entry.genre === 'Romance') genre.push('Romantic');
  if (entry.genre === 'Sci-Fi') genre.push('Scifi');
    if (isSeason) genre.push('Series', 'TV Show');
  if (entry.track === 'agasobanuye') genre.push('Agasobanuye');
  return {
    id,
    title: entry.title,
    description: entry.description,
    year: entry.year,
    rating: entry.rating,
    genre,
    imageUrl: entry.poster ? `https://image.tmdb.org/t/p/w500${entry.poster}` : '',
    backdropUrl: entry.backdrop ? `https://image.tmdb.org/t/p/w1280${entry.backdrop}` : '',
    trailerUrl: videoFor(entry.track),
    duration: isSeason ? `${episodes.length} Episodes` : entry.duration,
    cast: entry.cast || [],
    trending: Boolean(entry.trending) || ROW_TITLES.trending.includes(entry.title),
    region: entry.region || 'International',
    track: entry.track || 'original',
    price: 0,
    freeEpisodeCount: 100,
    isFree: true,
    episodes
  };
};

const NARRATORS = ['Rocky Kimomo', 'Gaheza Simba', 'Sankara Da Premier', 'PK - The Sound', 'Junior Giti', 'OSHAkur7'];

export const buildMovieSeed = () => {
  const original = CATALOG.map((entry, index) => toMovie({ ...entry, track: 'original' }, 100 + index));
  const agasobanuye = CATALOG.map((entry, index) => {
    const narrator = NARRATORS[index % NARRATORS.length];
    return toMovie({
      ...entry,
      track: 'agasobanuye',
      region: narrator,
      cast: [narrator, ...(entry.cast || [])],
      description: `${entry.title} agasobanuye na ${narrator}. ${entry.description}`
    }, 500 + index);
  });
  return [...agasobanuye, ...original];
};

const byTrack = (movies, track) => (track ? movies.filter((item) => item.track === track) : movies);

const pickByTitles = (movies, titles) =>
  titles.map((title) => movies.find((m) => m.title === title)).filter(Boolean);

const byGenre = (movies, genre) =>
  movies.filter((m) =>
    Array.isArray(m.genre) && m.genre.some((g) => g.toLowerCase() === genre.toLowerCase() || (genre === 'Sci-Fi' && /sci-?fi/i.test(g)))
  );

export const buildCategories = (movies) => [
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

export const buildNarrators = (movies) => {
  const counts = {};
  movies.filter((movie) => movie.track === 'agasobanuye').forEach((movie) => {
    const name = movie.region || 'Unknown';
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};
