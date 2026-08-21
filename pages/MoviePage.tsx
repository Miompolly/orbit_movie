import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Movie, Comment, User } from '../types';
import MovieCard from '../components/MovieCard';
import CommentThread from '../components/CommentThread';
import { api as movieApi } from '../services/shopApi';
import { ga } from '../services/ga';

interface MoviePageProps {
  movies: Movie[];
  wishlist: Movie[];
  onToggleWishlist: (movie: Movie) => void;
  user?: User | null;
}

const VIDEO_PROXY_BASE = '/api/proxy/video?url=';

function isExternalUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/uploads/') || url.startsWith('/api/')) return false;
  try {
    const u = new URL(url, 'http://localhost');
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return false;
    if (u.pathname.startsWith('/uploads/')) return false;
    return true;
  } catch { return false; }
}

function proxyUrl(url: string): string {
  if (!url || !isExternalUrl(url)) return url;
  return VIDEO_PROXY_BASE + encodeURIComponent(url);
}

const MoviePage: React.FC<MoviePageProps> = ({ movies, user = null }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const movie = movies.find((m) => String(m.id) === String(id));
  const [isWatching, setIsWatching] = useState(searchParams.get('play') === '1');
  const [showAllParts, setShowAllParts] = useState(false);
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState(0);
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'comments' | 'films'>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPart = selectedPartId ? movies.find((m) => m.id === selectedPartId) : null;
  const currentMovie = selectedPart || movie;

  const episodes = movie?.episodes && movie.episodes.length > 0 ? movie.episodes : [];
  const isSeries = movie?.type === 'series' || episodes.length > 0;
  const rawVideoUrl = currentMovie?.videoUrl || currentMovie?.trailerUrl || movie?.videoUrl || movie?.trailerUrl || '';
  const videoUrl = proxyUrl(rawVideoUrl);

  const resumeKey = (movieId: number | string, epIndex: number) => `resume-${movieId}-${epIndex}`;

  const saveProgress = (movieId: number | string, epIndex: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const el = videoRef.current;
      if (el && el.currentTime > 5 && !el.ended) {
        try { localStorage.setItem(resumeKey(movieId, epIndex), String(el.currentTime)); } catch {}
      }
    }, 2000);
  };

  const onVideoLoaded = () => {
    if (!isSeries || !movie) return;
    const el = videoRef.current;
    if (!el) return;
    const saved = localStorage.getItem(resumeKey(movie.id, activeEpisodeIndex));
    if (saved) {
      const time = parseFloat(saved);
      if (Number.isFinite(time) && time > 0) el.currentTime = time;
    }
  };

  const onVideoTimeUpdate = () => {
    if (isSeries && movie) saveProgress(movie.id, activeEpisodeIndex);
  };

  const onVideoEnded = () => {
    if (isSeries && movie) {
      try { localStorage.removeItem(resumeKey(movie.id, activeEpisodeIndex)); } catch {}
      if (activeEpisodeIndex < episodes.length - 1) {
        setActiveEpisodeIndex(activeEpisodeIndex + 1);
      }
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setShowAllParts(false);
    setSelectedPartId(null);
    if (!movie) return;
    const urlEp = searchParams.get('ep');
    if (isSeries && episodes.length > 0) {
      if (urlEp !== null) {
        setActiveEpisodeIndex(Math.max(0, Number(urlEp) || 0));
      } else {
        let found = false;
        for (let i = 0; i < episodes.length; i++) {
          const saved = localStorage.getItem(resumeKey(movie.id, i));
          if (saved && parseFloat(saved) > 0) { setActiveEpisodeIndex(i); found = true; break; }
        }
        if (!found) setActiveEpisodeIndex(0);
      }
    } else {
      setActiveEpisodeIndex(0);
    }
    setMobilePanel('comments');
    if (id) {
      movieApi.movieComments(id).then(setComments).catch(() => setComments([]));
    }
  }, [id, searchParams.get('ep')]);

  useEffect(() => {
    if (!movie) return;
    ga.movieView({ id: movie.id, title: movie.title, genre: movie.genre });
    const title = `${movie.title} (${movie.year}) - Orbit Movie`;
    const desc = movie.description || movie.overview || `Watch ${movie.title} on Orbit Movie with Kinyarwanda narration or original audio.`;
    const img = movie.backdropUrl || movie.imageUrl;

    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', 'video.other');
    setMeta('property', 'og:url', window.location.href);
    if (img) setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    if (img) setMeta('name', 'twitter:image', img);

    return () => {
      document.title = 'Orbit Movie - Watch Movies & Series with Kinyarwanda Narration';
      const defaultDesc = 'Watch movies and series with Kinyarwanda narration or original audio.';
      setMeta('name', 'description', defaultDesc);
      setMeta('property', 'og:title', 'Orbit Movie - Watch Movies & Series with Kinyarwanda Narration');
      setMeta('property', 'og:description', defaultDesc);
      setMeta('property', 'og:type', 'website');
      setMeta('property', 'og:url', 'https://movieexchange.com');
    };
  }, [movie]);

  useEffect(() => {
    if (searchParams.get('play') === '1') {
      videoRef.current?.play().catch(() => {});
    }
  }, [movie?.id, isSeries, activeEpisodeIndex]);

  if (!movie) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Title not found</h1>
        <p className="text-bTextSecondary text-sm mb-6">This movie page does not exist.</p>
        <button onClick={() => navigate('/')} className="bg-bYellow text-black px-5 py-2 rounded-[4px] font-bold text-sm">Back home</button>
      </div>
    );
  }

  const activeEp = isSeries ? (episodes[activeEpisodeIndex] || episodes[0]) : null;
  const currentVideoUrl = proxyUrl(isSeries ? (activeEp?.url || rawVideoUrl) : rawVideoUrl);
  const currentRawUrl = isSeries ? (activeEp?.url || rawVideoUrl) : rawVideoUrl;

  const handleSelectPart = (index: number) => {
    setActiveEpisodeIndex(index);
    ga.moviePlay({ id: movie.id, title: movie.title });
    navigate(`/movie/${movie.id}?play=1&ep=${index}`, { replace: true });
    requestAnimationFrame(() => { videoRef.current?.play().catch(() => {}); });
  };

  const META_TAGS = ['series', 'tv show', 'cinema', 'easter stream', 'izisobanuye'];
  const matchesGenre = (film: Movie, genre: string) => {
    const target = genre.toLowerCase();
    return film.genre?.some((g) => {
      const name = g.toLowerCase();
      if (target === 'romantic' || target === 'romance') return name === 'romantic' || name === 'romance';
      if (target === 'sci-fi' || target === 'scifi') return name === 'sci-fi' || name === 'scifi';
      return name === target;
    });
  };
  const primaryGenre = movie.genre?.find((g) => !META_TAGS.includes(g.toLowerCase())) || movie.genre?.[0];

  const sameFranchise = movie.franchise
    ? movies.filter((m) => m.franchise === movie.franchise && m.part).sort((a, b) => (a.part || 0) - (b.part || 0))
    : [];
  const hasFranchise = sameFranchise.length > 1;
  const franchiseIdx = hasFranchise ? sameFranchise.findIndex((m) => m.id === movie.id) : -1;
  const prevFranchiseMovie = franchiseIdx > 0 ? sameFranchise[franchiseIdx - 1] : null;
  const nextFranchiseMovie = franchiseIdx >= 0 && franchiseIdx < sameFranchise.length - 1 ? sameFranchise[franchiseIdx + 1] : null;

  const sameGenreAll = movies.filter((m) => matchesGenre(m, primaryGenre) && (!m.franchise || m.part === 1 || !m.part));
  const moreFilms = sameGenreAll.filter((m) => m.id !== movie.id);

  const prevGenreMovie = !hasFranchise ? (() => {
    const idx = sameGenreAll.findIndex((m) => m.id === movie.id);
    return idx > 0 ? sameGenreAll[idx - 1] : null;
  })() : null;
  const nextGenreMovie = !hasFranchise ? (() => {
    const idx = sameGenreAll.findIndex((m) => m.id === movie.id);
    return idx >= 0 && idx < sameGenreAll.length - 1 ? sameGenreAll[idx + 1] : null;
  })() : null;

  const prevMovie = hasFranchise ? prevFranchiseMovie : prevGenreMovie;
  const nextMovie = hasFranchise ? nextFranchiseMovie : nextGenreMovie;

  const canPrevPart = isSeries ? activeEpisodeIndex > 0 : !!prevMovie;
  const canNextPart = isSeries ? activeEpisodeIndex < episodes.length - 1 : !!nextMovie;

  const goPrevious = () => {
    if (isSeries && canPrevPart) {
      handleSelectPart(activeEpisodeIndex - 1);
    } else if (prevMovie) {
      navigate(`/movie/${prevMovie.id}`);
    }
  };
  const goNext = () => {
    if (isSeries && canNextPart) {
      handleSelectPart(activeEpisodeIndex + 1);
    } else if (nextMovie) {
      navigate(`/movie/${nextMovie.id}`);
    }
  };
  const prevDisabled = !canPrevPart;
  const nextDisabled = !canNextPart;

  const handlePlayOnPage = () => {
    ga.moviePlay({ id: movie.id, title: movie.title });
    if (isSeries) {
      handleSelectPart(activeEpisodeIndex);
    } else {
      setIsWatching(true);
      navigate(`/movie/${movie.id}?play=1`, { replace: true });
      requestAnimationFrame(() => { videoRef.current?.play().catch(() => {}); });
    }
  };

  const handlePostComment = async (text: string, parentId?: string) => {
    ga.comment(movie.id);
    const saved = await movieApi.postMovieComment(movie.id, text, parentId);
    setComments((prev) => [saved, ...prev]);
  };
  const handleLikeComment = async (commentId: string) => {
    const saved = await movieApi.likeMovieComment(movie.id, commentId);
    setComments((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
  };
  const handlePinComment = async (commentId: string) => {
    const saved = await movieApi.pinMovieComment(movie.id, commentId);
    setComments((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
  };

  const partsMeta = isSeries
    ? `${episodes.length} ${episodes.length === 1 ? 'Episode' : 'Episodes'}`
    : movie.duration;

  const episodeListPanel = (
    <div className="grid grid-cols-2 gap-3 pb-4">
      {episodes.map((ep, i) => (
        <button
          key={ep.id}
          onClick={() => handleSelectPart(i)}
          className={`overflow-hidden rounded-[4px] bg-bDark text-left transition-all ${
            activeEpisodeIndex === i ? 'ring-1 ring-bYellow' : 'hover:bg-white/5'
          }`}
        >
          <div className="relative aspect-video bg-black">
            <img
              src={movie.backdropUrl || movie.imageUrl}
              alt={ep.title || `Episode ${i + 1}`}
              className="h-full w-full object-cover"
            />
            <div className={`absolute inset-0 flex items-center justify-center ${activeEpisodeIndex === i ? 'bg-black/30' : 'bg-black/50 hover:bg-black/30 transition-colors'}`}>
              {activeEpisodeIndex === i ? (
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-bYellow text-black">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </span>
              ) : (
                <span className="text-white text-xs font-bold bg-black/60 rounded px-2 py-1">{i + 1}</span>
              )}
            </div>
            <span className="absolute left-2 top-2 rounded-[4px] bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
              {ep.title || `Episode ${i + 1}`}
            </span>
          </div>
          <div className="px-3 py-2">
            <p className={`text-sm font-medium truncate ${activeEpisodeIndex === i ? 'text-bYellow' : 'text-white'}`}>
              {ep.title || `Episode ${i + 1}`}
            </p>
            {(() => {
              const saved = localStorage.getItem(resumeKey(movie.id, i));
              if (saved) {
                const time = parseFloat(saved);
                if (Number.isFinite(time) && time > 0) {
                  return <p className="text-[10px] text-bYellow mt-1">Resume at {Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, '0')}</p>;
                }
              }
              return null;
            })()}
          </div>
        </button>
      ))}
    </div>
  );

  const commentsBlock = (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-white font-semibold">Comments <span className="text-bTextSecondary font-medium">({comments.length})</span></h2>
        <span className="text-bYellow font-semibold text-sm whitespace-nowrap">★ {movie.rating?.toFixed(1) || 'N/A'}</span>
      </div>
      <CommentThread comments={comments} user={user} onPost={handlePostComment} onLike={handleLikeComment} onPin={handlePinComment} />
    </div>
  );

  const filmsBlock = (
    <div className="grid grid-cols-2 gap-3 pb-4">
      {moreFilms.map((film) => (
        <MovieCard key={film.id} movie={film} onSelect={(m) => { ga.movieSelect({ id: m.id, title: m.title }); navigate(`/movie/${m.id}`); }} />
      ))}
    </div>
  );

  return (
    <div className="h-full min-h-0 flex flex-col bg-bBlack animate-fade-in overflow-hidden">
      <div className="px-4 md:px-10 pt-4 pb-3 shrink-0">
        <button onClick={() => navigate(-1)} className="w-fit text-sm text-bTextSecondary hover:text-white flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 px-4 md:px-10 pb-4 overflow-hidden">
        <div className="flex flex-col min-h-0 lg:col-span-7 lg:overflow-y-auto hide-scrollbar lg:pr-1">
          {isSeries ? (
            <div className="bg-black rounded-[4px] overflow-hidden shrink-0">
              {currentVideoUrl ? (
                <video
                  ref={videoRef}
                  key={`${movie.id}-ep-${activeEpisodeIndex}`}
                  src={currentVideoUrl}
                  className="w-full aspect-video object-cover"
                  controls
                  autoPlay
                  playsInline
                  onLoadedData={onVideoLoaded}
                  onTimeUpdate={onVideoTimeUpdate}
                  onEnded={onVideoEnded}
                />
              ) : (
                <img src={movie.backdropUrl || movie.imageUrl} alt={movie.title} className="w-full aspect-video object-cover" />
              )}
            </div>
          ) : (
            <div className="relative aspect-video overflow-hidden rounded-[4px] bg-black shrink-0">
              {isWatching ? (
                <video
                  ref={videoRef}
                  key={`${movie.id}-watch`}
                  src={videoUrl}
                  className="h-full w-full object-cover"
                  controls
                  autoPlay
                  playsInline
                  onTimeUpdate={onVideoTimeUpdate}
                  poster={movie.backdropUrl}
                />
              ) : (
                <>
                  <img src={movie.backdropUrl || movie.imageUrl} alt={movie.title} className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <button onClick={handlePlayOnPage} className="w-16 h-16 rounded-full bg-bYellow/90 hover:bg-bYellow flex items-center justify-center transition-transform hover:scale-105">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </button>
                  </span>
                </>
              )}
              <span className="absolute left-3 top-3 z-20 rounded-[4px] bg-bYellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                Now Playing
              </span>
              <span className="absolute right-3 top-3 z-20 rounded-[4px] bg-black/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {movie.track === 'agasobanuye' ? 'Agasobanuye' : 'Original'}
              </span>
            </div>
          )}

          <div className="mt-4 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <button onClick={handlePlayOnPage}
                  className="flex items-center gap-2 bg-bYellow text-black px-5 py-2 rounded-[4px] text-sm font-bold hover:bg-bYellowHover shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Play
                </button>
                {isSeries && (
                  <button type="button"
                    onClick={() => {
                      setShowAllParts((open) => {
                        const next = !open;
                        if (next) setMobilePanel('films');
                        return next;
                      });
                    }}
                    className={`px-4 py-2 rounded-[4px] text-sm font-bold shrink-0 ${showAllParts ? 'bg-bYellow text-black' : 'bg-white/10 text-white hover:bg-white/15'}`}>
                    All
                  </button>
                )}
              </div>
              <p className="shrink-0 whitespace-nowrap text-sm text-bTextSecondary">
                <span>{movie.year}</span>
                <span className="mx-1.5">·</span>
                <span>{partsMeta}</span>
              </p>
            </div>
            <h1 className="mt-3 text-lg md:text-2xl font-bold text-white tracking-tight truncate">{selectedPart ? (selectedPart.franchise && selectedPart.part ? selectedPart.title.replace(/\s*-\s*Part\s*\d+$/i, '').trim() : selectedPart.title) : (movie.franchise && movie.part ? movie.title.replace(/\s*-\s*Part\s*\d+$/i, '').trim() : movie.title)}</h1>
            {hasFranchise && sameFranchise.length > 1 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {sameFranchise.map((partMovie, idx) => {
                  const isActive = selectedPartId ? partMovie.id === selectedPartId : partMovie.id === movie.id;
                  return (
                    <button
                      key={partMovie.id}
                      type="button"
                      onClick={() => {
                        ga.movieSelect({ id: partMovie.id, title: partMovie.title });
                        setSelectedPartId(partMovie.id);
                        setIsWatching(true);
                        setActiveEpisodeIndex(0);
                      }}
                      className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-bYellow text-black'
                          : 'bg-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      Part {partMovie.part || idx + 1}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:hidden flex shrink-0 gap-0 mt-4 border-b border-white/10">
            <button type="button" onClick={() => { setShowAllParts(false); setMobilePanel('comments'); }}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 -mb-px ${mobilePanel === 'comments' ? 'border-bYellow text-white' : 'border-transparent text-bTextSecondary'}`}>
              Comments
            </button>
            <button type="button" onClick={() => { setShowAllParts(false); setMobilePanel('films'); }}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 -mb-px ${mobilePanel === 'films' ? 'border-bYellow text-white' : 'border-transparent text-bTextSecondary'}`}>
              {isSeries ? `Episodes (${episodes.length})` : `More ${primaryGenre}`}
            </button>
          </div>

          <div className={`${mobilePanel === 'comments' ? 'flex-1 min-h-0 overflow-y-auto' : 'hidden'} lg:mt-8 lg:block lg:flex-none lg:overflow-visible`}>
            <div className="pt-4 lg:pt-0">{commentsBlock}</div>
          </div>

          <div className={`${mobilePanel === 'films' ? 'flex-1 min-h-0 overflow-y-auto pt-4' : 'hidden'} lg:hidden`}>
            {showAllParts ? episodeListPanel : filmsBlock}
          </div>
        </div>

        <aside className="hidden lg:flex lg:col-span-5 min-h-0 flex-col overflow-hidden">
          {!showAllParts && isSeries && (
            <h2 className="text-white font-semibold mb-3 shrink-0">Episodes ({episodes.length})</h2>
          )}
          {!showAllParts && !isSeries && (
            <h2 className="text-white font-semibold mb-3 shrink-0">More {primaryGenre}</h2>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
            {showAllParts ? episodeListPanel : (isSeries && !showAllParts ? episodeListPanel : filmsBlock)}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MoviePage;
