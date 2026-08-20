import React, { useRef } from 'react';
import { Movie } from '../types';
import MovieCard from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onViewMore?: () => void;
}

const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onSelectMovie, onViewMore }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -scrollRef.current.clientWidth : scrollRef.current.clientWidth;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-5 px-6 md:px-10">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">
            {title}
          </h2>
          <div className="mt-1.5 h-0.5 w-10 rounded-full bg-bYellow" />
        </div>
        <div className="flex items-center gap-3">
          {onViewMore && (
            <button
              type="button"
              onClick={onViewMore}
              className="text-lg font-semibold tracking-tight text-bYellow hover:text-bYellowHover underline underline-offset-4 md:text-xl"
            >
              View More
            </button>
          )}
          <button
            type="button"
            onClick={() => scroll('left')}
            className="flex h-8 w-8 mb-1 items-center justify-center rounded-full bg-white/5 text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-bYellow"
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="flex h-8 w-8 mb-1 items-center justify-center rounded-full bg-white/5 text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-bYellow"
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-5 hide-scrollbar snap-x snap-mandatory"
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={onSelectMovie}
            className="w-[calc((100%-1rem)/2)] shrink-0 snap-start md:w-[calc((100%-3rem)/4)]"
          />
        ))}
      </div>
    </section>
  );
};

export default MovieRow;
