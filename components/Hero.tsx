import React, { useEffect, useState } from 'react';
import { Movie } from '../types';
import { ga } from '../services/ga';

interface HeroProps {
  movie: Movie | undefined;
  movies?: Movie[];
  onPlay: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
}

const Hero: React.FC<HeroProps> = ({ movie, movies = [], onPlay, onMoreInfo }) => {
  const slides = (movies.length > 0 ? movies : movie ? [movie] : []).slice(0, 8);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.map((item) => item.id).join('-')]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const current = slides[index] || movie;

  if (!current) {
    return (
      <div className="w-full h-[50vh] bg-bBlack flex items-center justify-center text-bTextSecondary">
        Loading...
      </div>
    );
  }

  return (
    <section className="relative w-full overflow-hidden">
      <img
        src={current.backdropUrl || current.imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-bBlack via-black/50 to-black/35" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center px-6 md:px-10 py-6">
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-[4px] bg-bBlack aspect-video">
            <img
              src={current.backdropUrl || current.imageUrl}
              alt={current.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setIndex(slideIndex)}
                  className={`h-1.5 rounded-full transition-all ${
                    slideIndex === index ? 'w-6 bg-bYellow' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Show ${slide.title}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-end gap-3 py-2 lg:py-6">
          <div className="flex items-center gap-2">
            <span className="bg-bYellow text-black text-xs font-bold px-2 py-0.5 rounded-[4px]">TOP 1</span>
            <span className="text-bYellow text-sm font-medium tracking-wide uppercase">{current.genre[0]}</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight tracking-tight drop-shadow-lg">
            {current.title}
          </h1>

          <p className="text-white/80 text-sm md:text-base line-clamp-3 max-w-xl">
            {current.description}
          </p>

          <div className="flex items-center gap-3 text-sm text-white/70">
            <span>{current.year}</span>
            <span className="h-1 w-1 rounded-full bg-white/70" />
            <span>{current.duration}</span>
            <span className="h-1 w-1 rounded-full bg-white/70" />
            <span className="text-bYellow font-semibold">★ {current.rating?.toFixed(1) || 'N/A'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1">
            <button
              onClick={() => { ga.moviePlay({ id: current.id, title: current.title }); onPlay(current); }}
              className="flex items-center gap-2 bg-bYellow text-black px-6 py-2.5 rounded-[4px] text-sm font-bold hover:bg-bYellowHover transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Play Now
            </button>

            <button
              onClick={() => { ga.movieSelect({ id: current.id, title: current.title }); onMoreInfo(current); }}
              className="flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white px-6 py-2.5 rounded-[4px] text-sm font-medium hover:bg-black/70 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              More Info
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
