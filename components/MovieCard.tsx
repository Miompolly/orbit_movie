import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../types';
import { ga } from '../services/ga';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  className?: string;
  onRemove?: (id: number) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect, className = '', onRemove }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const genre = movie.genre?.[0] || 'Movie';
  const region = movie.region || 'International';
  const duration = movie.duration || '—';
  const rating = Number.isFinite(movie.rating) ? movie.rating.toFixed(1) : '0.0';
  const displayTitle = movie.franchise && movie.part ? movie.title.replace(/\s*-\s*Part\s*\d+$/i, '').trim() : movie.title;
  const partsCount = movie.episodes?.length || 1;
  const isEpisodeShow =
    movie.genre?.some((g) => /series|tv show/i.test(g)) ||
    (movie.episodes?.some((ep) => /episode/i.test(ep.title)) ?? false);
  const partsLabel = isEpisodeShow
    ? `${partsCount} ${partsCount === 1 ? 'Ep' : 'Eps'}`
    : `${partsCount} ${partsCount === 1 ? 'Part' : 'Parts'}`;
  const showParts = isEpisodeShow || partsCount > 1;

  useEffect(() => {
    if (!showMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showMenu]);

  const shareMovie = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const url = `${window.location.origin}/movie/${movie.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    ga.share(movie.id);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    ga.addToWishlist({ id: movie.id, title: displayTitle });
    onSelect(movie);
  };

  return (
    <article
      onClick={() => { ga.movieSelect({ id: movie.id, title: displayTitle }); onSelect(movie); }}
      className={`group cursor-pointer overflow-hidden rounded-[4px] bg-[#101216] ${className}`}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        <img
          src={movie.backdropUrl || movie.imageUrl}
          alt={movie.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />

        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />

        {showParts && (
          <span className="absolute left-2 top-2 z-20 rounded-[4px] bg-black/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {partsLabel}
          </span>
        )}

        <div ref={menuRef} className="absolute right-2 top-2 z-30">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 bg-bDark border border-bGray rounded-lg shadow-2xl py-1 w-40 animate-fade-in z-50">
              <button
                type="button"
                onClick={shareMovie}
                className="w-full text-left px-3 py-2 text-xs font-medium text-bText hover:bg-bGray hover:text-bYellow flex items-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button
                type="button"
                onClick={handleWishlist}
                className="w-full text-left px-3 py-2 text-xs font-medium text-bText hover:bg-bGray hover:text-bYellow flex items-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                More Info
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  const url = `${window.location.origin}/movie/${movie.id}`;
                  const text = `${movie.title} (${movie.year}) - ${movie.genre?.join(', ') || 'Movie'}\n${movie.description || movie.overview || ''}\n${url}`;
                  navigator.clipboard.writeText(text).catch(() => {});
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-bText hover:bg-bGray hover:text-bYellow flex items-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRemove(movie.id); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-bRed hover:bg-bGray flex items-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              )}
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex h-12 w-12 translate-y-2 items-center justify-center rounded-full bg-bYellow text-black opacity-0 shadow-[0_8px_24px_rgba(252,213,53,0.35)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="rounded-[4px] bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {movie.year}
            </span>
            {movie.trending && (
              <span className="rounded-[4px] bg-bYellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                Hot
              </span>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-bYellow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {rating}
          </span>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-bTextSecondary">
          {region}
        </p>
        <h3 className="mt-0.5 line-clamp-1 text-[13px] font-semibold leading-snug tracking-tight text-white transition-colors duration-200 group-hover:text-bYellow">
          {displayTitle}
        </h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-bTextSecondary">
          <span className="truncate">{genre}</span>
          <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-bTextSecondary/70" />
          <span className="shrink-0">{duration}</span>
        </p>
      </div>
    </article>
  );
};

export default MovieCard;
