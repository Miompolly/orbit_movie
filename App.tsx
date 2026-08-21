
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import AuthPage from './pages/AuthPage';
import Footer from './components/Footer';
import ShopAdminPage from './pages/ShopAdminPage';
import AddMoviePage from './pages/AddMoviePage';
import EditMoviePage from './pages/EditMoviePage';
import UserProfile from './components/UserProfile';
import MovieCard from './components/MovieCard';
import MoviePage from './pages/MoviePage';
import NarratorRow from './components/NarratorRow';
import { api } from './services/movieService';
import { pingApi, setToken } from './services/apiClient';
import { api as movieApi } from './services/shopApi';
import { Movie, User, Category, ShopOrder, Comment } from './types';

const FILTERS = ['All', 'Action', 'Romance', 'Horror', 'Indian', 'Cartoon', 'Sci-Fi', 'Drama', 'Comedy', 'Others'];

const byTrack = (list: Movie[], track: 'all' | 'agasobanuye' | 'original') =>
  track === 'all' ? list : list.filter((m) => (m.track || 'original') === track);

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMovieRoute = location.pathname.startsWith('/movie/');
  const isAdminRoute = location.pathname.startsWith('/admin/movie');
  const [user, setUser] = useState<User | null>(null);
  const [rentedMovies] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const displayMovies = allMovies.filter(m => !m.franchise || m.part === 1 || !m.part);
  const filterCategoryParts = (cats: Category[]): Category[] =>
    cats.map(c => ({ ...c, movies: c.movies.filter(m => !m.franchise || m.part === 1 || !m.part) }));
  const [categories, setCategories] = useState<Category[]>([]);
  const [apiError, setApiError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTrack, setActiveTrack] = useState<'all' | 'agasobanuye' | 'original'>('all');
  const activeTrackLabel = activeTrack === 'agasobanuye' ? 'Agasobanuye' : activeTrack === 'original' ? 'Original' : '';
  const [wishlist, setWishlist] = useState<Movie[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [displayedCategories, setDisplayedCategories] = useState<Category[]>([]);
  const [filteredMoviesGrid, setFilteredMoviesGrid] = useState<Movie[]>([]);
  const [activeHeroMovie, setActiveHeroMovie] = useState<Movie | undefined>(undefined);

  const handleSubscribeVIP = (): boolean => {
    if (user) {
      const next = { ...user, isVip: true };
      setUser(next);
      movieApi.updateMe({ isVip: true }).catch(() => undefined);
    }
    return true;
  };

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-GHVJKRX5PY', { page_path: location.pathname + location.search });
    }
  }, [location]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '') {
      setActiveTab('home');
    } else if (path === '/movies') {
      setActiveTab('movies');
    } else if (path === '/series') {
      setActiveTab('series');
    } else if (path === '/music') {
      setActiveTab('music');
    } else if (path === '/watchlist') {
      setActiveTab('watchlist');
    } else if (path === '/login' || path === '/register') {
      setActiveTab('auth');
    } else if (path === '/profile') {
      setActiveTab('profile');
    } else if (path.startsWith('/admin')) {
      setActiveTab('admin');
    }
  }, [location.pathname]);

  useEffect(() => {
    const titles: Record<string, string> = {
      home: 'Orbit Movie - Watch Movies & Series with Kinyarwanda Narration',
      movies: 'Movies - Orbit Movie',
      series: 'Series - Orbit Movie',
      music: 'Music - Orbit Movie',
      watchlist: 'My Wish List - Orbit Movie',
      profile: 'My Profile - Orbit Movie',
      admin: 'Admin Dashboard - Orbit Movie',
      auth: 'Sign In - Orbit Movie'
    };
    document.title = titles[activeTab] || 'Orbit Movie - Watch Movies & Series with Kinyarwanda Narration';

    const descriptions: Record<string, string> = {
      home: 'Watch movies and series with Kinyarwanda narration or original audio. Stream Action, Romance, Horror, Indian, Cartoon, Sci-Fi, Drama, Comedy and more.',
      movies: 'Browse and stream all movies on Orbit Movie. Watch with Kinyarwanda narration or original audio.',
      series: 'Watch series and TV shows on Orbit Movie with Kinyarwanda narration or original audio.',
      music: 'Listen to music on Orbit Movie.',
      watchlist: 'Your personal wish list of movies and series on Orbit Movie.',
      profile: 'Manage your Orbit Movie profile and settings.',
      admin: 'Admin dashboard for Orbit Movie.',
      auth: 'Sign in or create your Orbit Movie account.'
    };
    const desc = descriptions[activeTab] || descriptions.home;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', desc);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
  }, [activeTab]);

  useEffect(() => {
    if (allMovies.length > 0) {
      setActiveHeroMovie(allMovies.find(m => m.trending) || allMovies[0]);
    }
  }, []);

  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        await pingApi();
        const [movieList, rows] = await Promise.all([
          api.fetchMovies(),
          api.fetchCategories()
        ]);
        setAllMovies(movieList);
        setCategories(rows);
        setDisplayedCategories(filterCategoryParts(rows));
        setApiError('');
        try {
          const session = await movieApi.me();
          setUser(session);
          const [list, remoteOrders, remoteCart, usersList, commentsList] = await Promise.all([
            movieApi.wishlist(),
            movieApi.orders().catch(() => []),
            movieApi.cart().catch(() => ({})),
            movieApi.users().catch(() => []),
            movieApi.allComments().catch(() => [])
          ]);
          setWishlist(list);
          setOrders(remoteOrders);
          setCart(remoteCart);
          setUsers(usersList);
          setComments(commentsList);
        } catch {
          /* guest */
        }
      } catch {
        setApiError('Cannot reach the Movie API. Start it with npm run server.');
      }
    };
    loadFromBackend();
  }, []);

  useEffect(() => {
    if (!activeHeroMovie && allMovies.length > 0) {
      setActiveHeroMovie(allMovies.find((m) => m.trending) || allMovies[0]);
    }
  }, [allMovies, activeHeroMovie]);

  const performFilter = (filter: string): Movie[] => {
    if (filter === 'All') return displayMovies;
    if (filter === 'Music') return displayMovies.filter(m => m.genre?.includes('Music'));
    if (filter === 'Seasons' || filter === 'Series') {
      return displayMovies.filter(m => m.type === 'series' || m.genre?.includes('Series') || m.genre?.includes('TV Show') || (m.episodes && m.episodes.length > 0));
    }
    if (filter === 'Romantic' || filter === 'Romance') {
      return displayMovies.filter(m => m.genre?.includes('Romantic') || m.genre?.includes('Romance'));
    }
    if (filter === 'Sci-Fi' || filter === 'Scifi') {
      return displayMovies.filter(m => m.genre?.some(g => /sci-?fi/i.test(g)));
    }
    return displayMovies.filter(m => m.genre?.includes(filter) || m.region === filter);
  };

  useEffect(() => {
    if (activeTab === 'home' && activeFilter === 'All' && activeTrack === 'all') {
      setFilteredMoviesGrid([]);
    } else if (activeTab === 'home') {
      const results = byTrack(performFilter(activeFilter), activeTrack);
      setFilteredMoviesGrid(results);
    } else if (activeTab === 'movies' || activeTab === 'series' || activeTab === 'music') {
      let filter = activeFilter;
      if (activeFilter === 'All') {
        if (activeTab === 'music') filter = 'Music';
        else if (activeTab === 'series') filter = 'Seasons';
      }
      const results = byTrack(performFilter(filter), activeTrack);
      setFilteredMoviesGrid(results);
    } else {
      const results = byTrack(performFilter('All'), activeTrack).slice(0, 12);
      setFilteredMoviesGrid(results);
    }
  }, [activeFilter, activeTrack, activeTab, allMovies]);

  const handleSearch = (query: string, category: string) => {
    if (!query && category === 'All Genres') {
      setActiveFilter('All');
      navigate('/');
      return;
    }
    const lower = query.toLowerCase();
    let results = displayMovies.filter(m =>
      m.title.toLowerCase().includes(lower) ||
      m.genre?.some(g => g.toLowerCase().includes(lower)) ||
      (m.region && m.region.toLowerCase().includes(lower))
    );
    if (category !== 'All Genres') {
      const catFilter = performFilter(category === 'Romantic' ? 'Romance' : category);
      results = results.filter(m => catFilter.some(cm => cm.id === m.id));
      if (!query) results = catFilter;
    }
    setActiveTab('movies');
    navigate('/movies');
    setFilteredMoviesGrid(byTrack(results, activeTrack));
    setActiveFilter(category === 'All Genres' ? 'All' : category);
  };

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRealtimeSearch = useCallback((query: string, category: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query || query.trim().length < 2) {
      if (query.length === 0) {
        setActiveTab('home');
        setActiveFilter('All');
        navigate('/');
      }
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await movieApi.searchMovies(query);
        let filtered = results;
        if (category !== 'All Genres') {
          const cat = category === 'Romantic' ? 'Romance' : category;
          filtered = results.filter(m => m.genre?.some(g => g.toLowerCase() === cat.toLowerCase()));
        }
        setActiveTab('movies');
        if (location.pathname !== '/movies') navigate('/movies');
        setFilteredMoviesGrid(byTrack(filtered, activeTrack));
        setActiveFilter(category === 'All Genres' ? 'All' : category);
      } catch {
        /* ignore */
      }
    }, 350);
  }, [navigate, activeTrack, location.pathname]);

  const handleMovieSelect = (movie: Movie) => {
    navigate(`/movie/${movie.id}`);
  };

  const handlePlayMovie = (movie: Movie) => {
    navigate(`/movie/${movie.id}?play=1`);
  };

  const handleAddMovie = async (newMovie: any): Promise<number> => {
    const episodes = (newMovie.episodes_data || []).map((ep: any, i: number) => ({
      id: `ep-${newMovie.id}-${i + 1}`,
      title: ep.title || `Episode ${i + 1}`,
      url: ep.videoUrl || '',
      quality: '1080p',
      isFree: true,
      duration: '',
      season: ep.season || 1
    }));
    const movie = { ...newMovie, episodes, episodes_data: undefined };
    const saved = await movieApi.createMovie(movie);
    setAllMovies((prev) => [saved, ...prev]);
    const rows = await movieApi.categories();
    setCategories(rows);
    setDisplayedCategories(filterCategoryParts(rows));
    return saved.id;
  };

  const handleUpdateMovie = async (updatedMovie: Movie) => {
    const saved = await api.updateMovie(updatedMovie);
    setAllMovies((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
    const rows = await api.fetchCategories();
    setCategories(rows);
    setDisplayedCategories(filterCategoryParts(rows));
  };

  const handleDeleteMovie = async (id: number) => {
    await api.deleteMovie(id);
    setAllMovies((prev) => prev.filter((m) => m.id !== id));
    const rows = await api.fetchCategories();
    setCategories(rows);
    setDisplayedCategories(filterCategoryParts(rows));
  };

  const handleToggleWishlist = async (movie: Movie) => {
    if (!user) {
      const exists = wishlist.find((item) => item.id === movie.id);
      setWishlist(exists ? wishlist.filter((item) => item.id !== movie.id) : [...wishlist, movie]);
      return;
    }
    const exists = wishlist.find((item) => item.id === movie.id);
    const list = exists ? await movieApi.removeWishlist(movie.id) : await movieApi.addWishlist(movie);
    setWishlist(list);
  };

  const handleRemoveFromWishlist = async (id: number) => {
    if (!user) {
      setWishlist(wishlist.filter((item) => item.id !== id));
      return;
    }
    setWishlist(await movieApi.removeWishlist(id));
  };

  const handleLogin = async (nextUser: User) => {
    setUser(nextUser);
    const [list, remoteOrders, remoteCart] = await Promise.all([
      movieApi.wishlist(),
      movieApi.orders().catch(() => []),
      movieApi.cart().catch(() => ({}))
    ]);
    setWishlist(list);
    setOrders(remoteOrders);
    setCart(remoteCart);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setWishlist([]);
    setOrders([]);
    setCart({});
    navigate('/', { replace: true });
  };

  const handleUpdateOrder = async (order: ShopOrder) => {
    const saved = await movieApi.updateOrder(order.id, { status: order.status });
    setOrders((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
  };

  const openAuth = () => {
    const path = location.pathname;
    navigate('/login', { state: { from: path === '/login' || path === '/register' ? '/' : path } });
  };

  return (
    <div className="h-screen overflow-hidden bg-bBlack text-bText font-sans flex flex-col">
      {!isAdminRoute && (
        <Navbar
          onSearch={handleSearch}
          user={user}
          onOpenAuth={openAuth}
          onLogout={handleLogout}
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'admin') {
              if (user?.isAdmin) navigate('/admin/movie');
              return;
            }
            if (tab === 'profile') {
              navigate('/profile');
              return;
            }
            setActiveFilter('All');
            setActiveTrack('all');
            if (tab === 'home') navigate('/');
            else navigate(`/${tab}`);
          }}
          wishlistCount={wishlist.length}
          onOpenWishlist={() => {
            setActiveFilter('All');
            navigate('/watchlist');
          }}
          activeTrack={activeTrack}
          onTrackChange={setActiveTrack}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          showFilters={activeTab === 'home' || activeTab === 'movies' || activeTab === 'series' || activeTab === 'music'}
        />
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className={`flex-1 min-h-0 flex flex-col relative bg-bBlack ${isMovieRoute || isAdminRoute ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <Routes>
            <Route
              path="/admin/movie/:tab?"
              element={
                user?.isAdmin ? (
                  <ShopAdminPage
                    user={user}
                    orders={orders}
                    movies={allMovies}
                    categories={categories}
                    users={users}
                    comments={comments}
                    onOpenAuth={openAuth}
                    onLogout={handleLogout}
                    onUpdateOrder={handleUpdateOrder}
                    onUpdateMovie={handleUpdateMovie}
                    onDeleteMovie={handleDeleteMovie}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <h1 className="text-xl font-bold text-white mb-2">Admin access required</h1>
                    <p className="text-bTextSecondary text-sm mb-6">Sign in with an admin account to access this page.</p>
                    <button onClick={openAuth} className="bg-bYellow text-black px-5 py-2 rounded-[4px] font-bold text-sm">Sign In</button>
                  </div>
                )
              }
            />
            <Route
              path="/admin/movie/add-movie"
              element={
                user?.isAdmin ? (
                  <AddMoviePage
                    user={user}
                    movies={allMovies}
                    onAddMovie={handleAddMovie}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <h1 className="text-xl font-bold text-white mb-2">Admin access required</h1>
                    <p className="text-bTextSecondary text-sm mb-6">Sign in with an admin account to access this page.</p>
                    <button onClick={openAuth} className="bg-bYellow text-black px-5 py-2 rounded-[4px] font-bold text-sm">Sign In</button>
                  </div>
                )
              }
            />
            <Route
              path="/admin/movie/edit-movie/:id"
              element={
                user?.isAdmin ? (
                  <EditMoviePage
                    user={user}
                    movies={allMovies}
                    onAddMovie={handleAddMovie}
                    onUpdateMovie={handleUpdateMovie}
                    onDeleteMovie={handleDeleteMovie}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <h1 className="text-xl font-bold text-white mb-2">Admin access required</h1>
                    <p className="text-bTextSecondary text-sm mb-6">Sign in with an admin account to access this page.</p>
                    <button onClick={openAuth} className="bg-bYellow text-black px-5 py-2 rounded-[4px] font-bold text-sm">Sign In</button>
                  </div>
                )
              }
            />
            <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />
            <Route path="/register" element={<AuthPage onLogin={handleLogin} />} />
            <Route
              path="/movie/:id"
              element={
                <MoviePage
                  movies={allMovies}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                  user={user}
                />
              }
            />
            <Route
              path="*"
              element={
                <>
          {apiError ? (
            <div className="mx-4 mt-3 rounded-[4px] border border-bRed/40 bg-bRed/10 px-4 py-2 text-sm text-white">
              {apiError}
            </div>
          ) : null}

          <div className="flex-1 flex flex-col">
            {activeTab === 'home' && activeFilter === 'All' && activeTrack === 'all' && (
              <div className="animate-fade-in flex-1 flex flex-col">
                <Hero
                  movie={activeHeroMovie}
                  movies={(displayedCategories.find((c) => c.id === 'recent')?.movies || displayMovies).slice(0, 5)}
                  onPlay={handlePlayMovie}
                  onMoreInfo={handleMovieSelect}
                />
                <div className="mt-4 space-y-2 pb-12">
                  {displayedCategories.map((category) => (
                    <div key={category.id}>
                      {category.movies.length > 0 && (
                        <MovieRow
                          title={category.title}
                          movies={category.movies}
                          onSelectMovie={handleMovieSelect}
                          onViewMore={() => {
                            const genreMap: Record<string, string> = {
                              Action: 'Action',
                              Romance: 'Romance',
                              Horror: 'Horror',
                              Indian: 'Indian',
                              Cartoon: 'Cartoon',
                              Scifi: 'Sci-Fi',
                              Drama: 'Drama',
                              Comedy: 'Comedy',
                              Others: 'Others'
                            };
                            const mapped = genreMap[category.title];
                            if (mapped) {
                              setActiveFilter(mapped);
                              return;
                            }
                            setFilteredMoviesGrid(category.movies);
                            setActiveTab('movies');
                            navigate('/movies');
                          }}
                        />
                      )}
                      {category.id === 'seasons' && (
                        <NarratorRow
                          onSelect={(name) => {
                            setFilteredMoviesGrid(displayMovies.filter((m) => m.region === name));
                            setActiveTab('movies');
                            navigate('/movies');
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'movies' || activeTab === 'series' || activeTab === 'music' || (activeTab === 'home' && (activeFilter !== 'All' || activeTrack !== 'all'))) && (
              <div className="px-6 md:px-10 py-6 min-h-[60vh] animate-fade-in pb-12 flex-1">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                     {activeTab === 'home'
                       ? `${[activeTrack !== 'all' ? activeTrackLabel : '', activeFilter].filter(Boolean).join(' ')} Movies`
                       : `${activeTab}`}
                     {activeFilter !== 'All' && activeTab !== 'home' && ` > ${activeFilter}`}
                   </h2>
                    <span className="text-bTextSecondary text-sm">{filteredMoviesGrid.length}</span>
                 </div>

                 {filteredMoviesGrid.length > 0 ? (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
                     {filteredMoviesGrid.map(movie => (
                       <MovieCard
                         key={movie.id}
                         movie={movie}
                         onSelect={handleMovieSelect}
                       />
                     ))}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-64 text-bTextSecondary">
                      <p>No content found matching this filter.</p>
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'profile' && (
              <UserProfile
                user={user}
                onUpdateUser={setUser}
                onOpenAuth={openAuth}
                onSubscribeVIP={handleSubscribeVIP}
                rentedMovies={rentedMovies}
                onOpenAdmin={() => navigate('/admin/movie')}
              />
            )}

            {activeTab === 'watchlist' && (
              <div className="px-6 md:px-10 py-6 min-h-[60vh] animate-fade-in pb-12 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bRed" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> My Wish List
                  </h2>
                   <span className="text-bTextSecondary text-sm">{wishlist.length}</span>
                </div>

                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 animate-fade-in">
                    {wishlist.map(movie => (
                       <MovieCard
                         key={movie.id}
                         movie={movie}
                         onSelect={handleMovieSelect}
                         onRemove={handleRemoveFromWishlist}
                       />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-bTextSecondary bg-bDark/20 border border-bGray/50 rounded-xl max-w-xl mx-auto p-8 text-center mt-8">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-bRed/50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                     <p className="text-white font-medium mb-1">Your wishlist is empty</p>
                     <p className="text-xs text-bTextSecondary max-w-xs">Explore movies and click "Add to List" on any film details page to track your favorites here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
                </>
              }
            />
           </Routes>
            {!isMovieRoute && !isAdminRoute && <Footer onNavigate={(tab) => {
              setActiveFilter('All');
              setActiveTrack('all');
              if (tab === 'home') navigate('/');
              else navigate(`/${tab}`);
            }} />}
         </div>
       </div>
       {!isAdminRoute && (
         <a
           href="https://wa.me/250726971109?text=Hi%2C%20I%20want%20to%20buy%20a%20movie"
           target="_blank"
           rel="noopener noreferrer"
           className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-lg bg-bYellow shadow-lg shadow-bYellow/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-bYellow/40"
           title="Buy movie on WhatsApp"
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-black" viewBox="0 0 24 24" fill="currentColor">
             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
           </svg>
         </a>
       )}
    </div>
  );
}

export default App;
