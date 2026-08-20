
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- MOCK DATA GENERATION (Ported from frontend for consistency) ---
const PLACEHOLDER_BASE = "https://picsum.photos";
const SAMPLE_TRAILER = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const REGIONS = ['Indundi', 'Inyarwanda', 'Tanzanie', 'Ingande', 'International', 'Burundi', 'Kenya', 'Uganda'];
const MOVIE_GENRES = ['Action', 'Romantic', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Documentary', 'Izisobanuye'];

const generateProduct = (id) => {
  const randomRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const randomGenre = MOVIE_GENRES[Math.floor(Math.random() * MOVIE_GENRES.length)];
  
  const isMusic = id % 15 === 0;
  const isSeries = !isMusic && (id % 10 === 0);
  const isAgasobanuye = !isMusic && !isSeries && (id % 5 === 0);
  
  let title = '', description = '', genre = [];
  
  if (isMusic) {
    title = `Hit Song Vol ${id}`;
    description = `Official music video for the chart-topping hit from ${randomRegion}.`;
    genre = ['Music', 'Market Music', randomRegion];
  } else if (isSeries) {
    title = `${randomGenre} Chronicles: Season ${Math.floor(Math.random() * 3) + 1}`;
    description = `A gripping multi-part series set in ${randomRegion}.`;
    genre = [randomGenre, 'Series', 'TV Show'];
  } else if (isAgasobanuye) {
     title = `Agasobanuye: ${randomGenre} Action ${id}`;
     description = `Translated interpretation of the classic ${randomGenre} film.`;
     genre = ['Izisobanuye', randomGenre, 'Action'];
  } else {
    title = `${randomGenre} Star ${id}`;
    description = `A cinematic masterpiece from ${randomRegion}.`;
    genre = [randomGenre, 'Cinema', 'Easter Stream'];
  }

  const episodes = [];
  if (isSeries) {
    for(let i=1; i<=5; i++) {
        episodes.push({
            id: `ep-${id}-${i}`,
            title: `Episode ${i}`,
            url: SAMPLE_TRAILER,
            quality: '1080p',
            isFree: i === 1,
            duration: '45m'
        });
    }
  } else {
    episodes.push({
        id: `main-${id}`,
        title: isAgasobanuye ? 'Part 1 (Full)' : 'Full Movie',
        url: SAMPLE_TRAILER,
        quality: '4K',
        isFree: id % 20 === 0,
        duration: '90m'
    });
  }

  return {
    id: id,
    title, description, year: 2020 + (id % 5),
    rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
    genre,
    imageUrl: `${PLACEHOLDER_BASE}/300/450?random=${id}`,
    backdropUrl: `${PLACEHOLDER_BASE}/1280/720?random=${id}`,
    trailerUrl: SAMPLE_TRAILER, 
    duration: isMusic ? '4 min' : (isSeries ? '12 Episodes' : `${90 + (id * 2)} min`),
    cast: ["John Doe", "Jane Smith", "Local Star"],
    trending: (id % 5 === 0) || (id < 105), 
    region: randomRegion,
    price: isMusic ? 0.99 : Number((3.99 + Math.random() * 5).toFixed(2)),
    freeEpisodeCount: isSeries ? 1 : 0,
    isFree: id % 20 === 0,
    episodes
  };
};

// Initialize In-Memory Database
let movies = Array.from({ length: 100 }).map((_, i) => generateProduct(100 + i));

// --- ROUTES ---

// Get All Movies
app.get('/api/movies', (req, res) => {
  res.json(movies);
});

// Get Single Movie
app.get('/api/movies/:id', (req, res) => {
  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (movie) res.json(movie);
  else res.status(404).json({ message: 'Movie not found' });
});

// Create Movie (Admin)
app.post('/api/movies', (req, res) => {
  const newMovie = { ...req.body, id: Date.now() }; // Simple ID generation
  movies.unshift(newMovie);
  res.status(201).json(newMovie);
});

// Update Movie (Admin)
app.put('/api/movies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = movies.findIndex(m => m.id === id);
  if (index !== -1) {
    movies[index] = { ...movies[index], ...req.body };
    res.json(movies[index]);
  } else {
    res.status(404).json({ message: 'Movie not found' });
  }
});

// Delete Movie (Admin)
app.delete('/api/movies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = movies.length;
  movies = movies.filter(m => m.id !== id);
  if (movies.length < initialLength) {
    res.json({ message: 'Movie deleted' });
  } else {
    res.status(404).json({ message: 'Movie not found' });
  }
});

// Mock Auth
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const isAdmin = email && email.includes('admin');
  res.json({
    token: 'mock-jwt-token-123456',
    user: {
      id: 'u-' + Date.now(),
      name: email.split('@')[0],
      email: email,
      isVip: isAdmin,
      isAdmin: isAdmin
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend Server running at http://localhost:${PORT}`);
});
