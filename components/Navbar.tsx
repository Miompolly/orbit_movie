
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface NavbarProps {
  onSearch: (query: string, category: string) => void;
  onSearchChange?: (query: string, category: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  activeTrack: 'all' | 'agasobanuye' | 'original';
  onTrackChange: (track: 'all' | 'agasobanuye' | 'original') => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  showFilters: boolean;
}

const MOVIE_SEARCH_CATEGORIES = [
  'All Genres',
  'Action',
  'Romance',
  'Horror',
  'Indian',
  'Cartoon',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Others'
];

const TRACK_FILTERS: { key: 'agasobanuye' | 'original'; label: string }[] = [
  { key: 'agasobanuye', label: 'Agasobanuye' },
  { key: 'original', label: 'Original' }
];

const GENRE_FILTERS = ['All', 'Action', 'Romance', 'Horror', 'Indian', 'Cartoon', 'Sci-Fi', 'Drama', 'Comedy', 'Others'];

const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  onSearchChange,
  user,
  onOpenAuth,
  onLogout,
  activeTab,
  onTabChange,
  wishlistCount,
  onOpenWishlist,
  activeTrack,
  onTrackChange,
  activeFilter,
  onFilterChange,
  showFilters
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('All Genres');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      onSearchChange(searchTerm, searchCategory);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchCategory]);

  useEffect(() => {
    if (!showMobileFilters) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-filter-menu]')) setShowMobileFilters(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showMobileFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm, searchCategory);
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'movies', label: 'Movies' },
    { id: 'series', label: 'Series' }
  ];

  const easter = (
    <button
      type="button"
      onClick={() => onTabChange('home')}
      className="flex items-center gap-1.5 group sm:gap-2"
    >
      <div className="relative h-7 w-7 shrink-0 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10">
        <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-[0_2px_8px_rgba(252,213,53,0.35)]" aria-hidden="true">
          <circle cx="20" cy="20" r="20" fill="#FCD535" />
          <path
            fill="#0B0E11"
            d="M15.8 12.15c0-1.02 1.12-1.64 1.98-1.1l12.35 7.55c.82.5.82 1.7 0 2.2L17.78 28.35c-.86.54-1.98-.08-1.98-1.1V12.15z"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-none text-left">
        <span className="font-black tracking-[0.14em] text-bYellow text-[12px] sm:text-[14px]">Orbit</span>
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.28em] text-bYellow sm:text-[10px]">Movie</span>
      </div>
    </button>
  );

  const activeTrackLabel = activeTrack === 'agasobanuye' ? 'Agasobanuye' : activeTrack === 'original' ? 'Original' : '';
  const filterSummary = [activeTrackLabel, activeFilter === 'All' ? '' : activeFilter].filter(Boolean).join(', ') || 'All';

  const mobileFilterButton = showFilters ? (
    <div className="md:hidden relative shrink-0" data-filter-menu>
      <button
        type="button"
        onClick={() => setShowMobileFilters(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-bGray bg-bDark text-[10px] font-bold text-bText hover:border-bYellow transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {filterSummary}
      </button>
      {showMobileFilters && (
        <div className="absolute top-full left-0 mt-1 bg-bDark border border-bGray rounded shadow-xl z-50 w-48 animate-fade-in p-3 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-bTextSecondary mb-2">Track</p>
            <div className="flex flex-col gap-1.5">
              {TRACK_FILTERS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { onTrackChange(activeTrack === opt.key ? 'all' : opt.key); setShowMobileFilters(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                    activeTrack === opt.key
                      ? 'bg-bYellow text-black border-bYellow'
                      : 'bg-transparent text-bTextSecondary border-transparent hover:text-white hover:bg-bGray/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-bGray/50 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-bTextSecondary mb-2">Genre</p>
            <div className="flex flex-col gap-1.5">
              {GENRE_FILTERS.map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => { onFilterChange(filter); setShowMobileFilters(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                    activeFilter === filter
                      ? 'bg-bYellow text-black border-bYellow'
                      : 'bg-transparent text-bTextSecondary border-transparent hover:text-white hover:bg-bGray/50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;

  const userMenu = showUserMenu && user ? (
    <div className="absolute top-12 right-0 bg-bDark border border-bGray text-white rounded-lg shadow-2xl py-2 w-56 animate-fade-in z-[60]">
      <div className="px-4 py-3 border-b border-bGray mb-2 bg-bBlack/20">
        <div className="text-sm font-bold truncate text-white">{user.name}</div>
        <div className="text-xs text-bTextSecondary truncate">{user.email}</div>
      </div>
      <button
        type="button"
        onClick={() => { onTabChange('profile'); setShowUserMenu(false); }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-bGray hover:text-bYellow transition-colors"
      >
        My Profile
      </button>
      <button
        type="button"
        onClick={() => { onOpenWishlist(); setShowUserMenu(false); }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-bGray hover:text-bYellow transition-colors"
      >
        My Wish List
      </button>
      {user.isAdmin && (
        <button
          type="button"
          onClick={() => { onTabChange('admin'); setShowUserMenu(false); }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-bGray hover:text-bYellow transition-colors"
        >
          Admin dashboard
        </button>
      )}
      <div className="border-t border-bGray my-2"></div>
      <button
        type="button"
        onClick={() => { onLogout(); setShowUserMenu(false); }}
        className="w-full text-left px-4 py-2 text-sm text-bRed hover:bg-bGray"
      >
        Log Out
      </button>
    </div>
  ) : null;

  const actions = (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
      {user ? (
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-bGray/50 transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-bYellow to-bYellowHover text-black font-bold flex items-center justify-center border border-transparent hover:border-white transition-all shadow-lg sm:w-8 sm:h-8">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">{user.name}</div>
              <div className="text-[10px] text-bTextSecondary leading-tight truncate max-w-[120px]">{user.email}</div>
            </div>
          </div>
          {userMenu}
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenAuth}
          className="h-8 text-[10px] font-bold text-white bg-bGray px-2 rounded hover:bg-bYellow hover:text-black transition-all sm:h-9 sm:text-xs sm:px-3"
        >
          Sign In
        </button>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-bBlack border-b border-bGray shadow-xl">
      <div className="px-6 md:px-10 py-1.5 sm:py-2">
        <div className="flex items-center gap-2">
          <div className="flex shrink-0 items-center gap-1.5">
            {easter}
          </div>

          {mobileFilterButton}

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <form
              onSubmit={handleSearch}
              className="flex h-8 min-w-0 flex-1 overflow-hidden rounded-[4px] border border-bGray bg-bDark transition-all focus-within:ring-2 focus-within:ring-bYellow/50 sm:h-9"
            >
              <div className="relative hidden h-full border-r border-bGray sm:block">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="h-full cursor-pointer appearance-none rounded-l-[4px] bg-transparent pl-3 pr-6 text-[11px] font-medium text-bText hover:text-white focus:outline-none sm:pl-4 sm:text-xs"
                >
                  {MOVIE_SEARCH_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-bDark text-white">
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 sm:right-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-bTextSecondary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-2 text-xs text-white placeholder-bTextSecondary focus:outline-none sm:px-3 sm:text-sm"
              />
              <button type="submit" className="flex items-center justify-center bg-bYellow px-2 hover:bg-bYellowHover sm:px-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            <div className="hidden items-center gap-3 text-xs font-bold text-bTextSecondary md:flex lg:gap-4 lg:text-sm">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onTabChange(link.id)}
                  className={`hover:text-bYellow transition-colors whitespace-nowrap ${activeTab === link.id ? 'text-bYellow' : ''}`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {actions}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="hidden md:block border-t border-bGray/50">
          <div className="px-6 md:px-10 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 shrink-0">
              {TRACK_FILTERS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onTrackChange(activeTrack === opt.key ? 'all' : opt.key)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all border shrink-0 ${
                    activeTrack === opt.key
                      ? 'bg-bYellow text-black border-bYellow'
                      : 'bg-transparent text-bTextSecondary border-transparent hover:text-white hover:bg-bGray/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {GENRE_FILTERS.map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onFilterChange(filter)}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all border shrink-0 ${
                    activeFilter === filter
                      ? 'bg-bYellow text-black border-bYellow'
                      : 'bg-transparent text-bTextSecondary border-transparent hover:text-white hover:bg-bGray/50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
