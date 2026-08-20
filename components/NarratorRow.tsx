import React, { useEffect, useRef, useState } from 'react';
import { api as movieApi } from '../services/shopApi';

interface NarratorRowProps {
  onSelect: (name: string) => void;
}

const NarratorRow: React.FC<NarratorRowProps> = ({ onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [narrators, setNarrators] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    movieApi.narrators().then(setNarrators).catch(() => setNarrators([]));
  }, []);

  if (!narrators.length) return null;

  return (
    <section className="py-5 px-6 md:px-10">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Studios</h2>
          <div className="mt-1.5 h-0.5 w-10 rounded-full bg-bYellow" />
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-5 hide-scrollbar snap-x snap-mandatory">
        {narrators.map((narrator) => (
          <button
            key={narrator.name}
            type="button"
            onClick={() => onSelect(narrator.name)}
            className="w-[calc((100%-1rem)/2)] shrink-0 snap-start rounded-[4px] bg-bDark p-4 text-left md:w-[calc((100%-3rem)/4)]"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bYellow text-lg font-bold text-black">
              {narrator.name.charAt(0)}
            </div>
            <p className="truncate text-sm font-semibold text-white">{narrator.name}</p>
            <p className="mt-1 text-xs text-bTextSecondary">{narrator.count.toLocaleString()} movies</p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default NarratorRow;
