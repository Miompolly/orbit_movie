
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api as movieApi } from '../services/shopApi';

interface AddMoviePageProps {
  user: any;
  movies: any[];
  onAddMovie: (movie: any) => Promise<number>;
}

const CATEGORIES = ['Action', 'Romance', 'Horror', 'Indian', 'Cartoon', 'Sci-Fi', 'Drama', 'Comedy', 'Others'];

const sidebarTabs = [
  { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'movies', label: 'Movies', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
  { id: 'reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'customers', label: 'Customers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'support', label: 'Support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' }
];

interface Episode {
  title: string;
  season: number;
  episode: number;
  videoUrl: string;
  overview: string;
  uploading: boolean;
}

const AddMoviePage: React.FC<AddMoviePageProps> = ({ user, movies, onAddMovie }) => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);
  const [backdropUploading, setBackdropUploading] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);
  const episodeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [form, setForm] = useState({
    title: '',
    overview: '',
    category: 'Action',
    track: 'original' as 'original' | 'agasobanuye',
    release_date: '',
    vote_average: '',
    poster_path: '',
    backdrop_path: '',
    videoUrl: '',
    runtime: '',
    type: 'movie' as 'movie' | 'series',
    totalSeasons: '1',
    episodes: '1',
    franchise: '',
    part: ''
  });

  const [episodes, setEpisodes] = useState<Episode[]>([
    { title: '', season: 1, episode: 1, videoUrl: '', overview: '', uploading: false }
  ]);

  interface Part {
    title: string;
    part: number;
    videoUrl: string;
    overview: string;
    uploading: boolean;
  }

  const [parts, setParts] = useState<Part[]>([]);

  const addPart = () => {
    setParts(prev => [...prev, {
      title: '',
      part: prev.length + 1,
      videoUrl: '',
      overview: '',
      uploading: false
    }]);
  };

  const removePart = (index: number) => {
    if (parts.length <= 1) return;
    setParts(prev => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, part: i + 1 })));
  };

  const updatePart = (index: number, field: keyof Part, value: string | number) => {
    setParts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleUploadPartVideo = async (file: File, partIndex: number) => {
    setParts(prev => prev.map((p, i) => i === partIndex ? { ...p, uploading: true } : p));
    try {
      const result = await movieApi.uploadVideo(file);
      setParts(prev => prev.map((p, i) => i === partIndex ? { ...p, videoUrl: result.url, uploading: false } : p));
    } catch (err: any) {
      setParts(prev => prev.map((p, i) => i === partIndex ? { ...p, uploading: false } : p));
      setError(err?.message || 'Video upload failed.');
    }
  };

  const partInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!user?.isAdmin) {
    return (
      <div className="fixed inset-0 z-[80] bg-bBlack flex items-center justify-center">
        <div className="text-center">
          <p className="text-bTextSecondary mb-4">Admin access required.</p>
          <button onClick={() => navigate('/')} className="bg-bYellow text-black px-6 py-2 rounded font-bold">Go Home</button>
        </div>
      </div>
    );
  }

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFranchiseChange = (value: string) => {
    update('franchise', value);
    if (value.trim()) {
      const existing = movies
        .filter((m: any) => m.franchise?.toLowerCase() === value.trim().toLowerCase() && m.part)
        .sort((a: any, b: any) => (b.part || 0) - (a.part || 0));
      if (existing.length > 0) {
        const last = existing[0];
        setForm(prev => ({
          ...prev,
          franchise: value,
          category: prev.category || last.genre?.[0] || 'Action',
        }));
        if (parts.length === 0) {
          setParts([{ title: '', part: 1, videoUrl: '', overview: '', uploading: false }]);
        }
      } else {
        if (parts.length === 0) {
          setParts([{ title: '', part: 1, videoUrl: '', overview: '', uploading: false }]);
        }
      }
    } else {
      setParts([]);
    }
  };

  const updateEpisode = (index: number, field: keyof Episode, value: string | number) => {
    setEpisodes(prev => prev.map((ep, i) => i === index ? { ...ep, [field]: value } : ep));
  };

  const addEpisode = () => {
    const last = episodes[episodes.length - 1];
    setEpisodes(prev => [...prev, {
      title: '',
      season: last?.season || 1,
      episode: (last?.episode || 0) + 1,
      videoUrl: '',
      overview: '',
      uploading: false
    }]);
  };

  const removeEpisode = (index: number) => {
    if (episodes.length <= 1) return;
    setEpisodes(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadVideo = async (file: File, episodeIndex?: number) => {
    if (episodeIndex !== undefined) {
      setEpisodes(prev => prev.map((ep, i) => i === episodeIndex ? { ...ep, uploading: true } : ep));
    } else {
      setVideoUploading(true);
    }
    try {
      const result = await movieApi.uploadVideo(file);
      if (episodeIndex !== undefined) {
        setEpisodes(prev => prev.map((ep, i) => i === episodeIndex ? { ...ep, videoUrl: result.url, uploading: false } : ep));
      } else {
        update('videoUrl', result.url);
      }
    } catch (err: any) {
      if (episodeIndex !== undefined) {
        setEpisodes(prev => prev.map((ep, i) => i === episodeIndex ? { ...ep, uploading: false } : ep));
      }
      setError(err?.message || 'Video upload failed.');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleUploadImage = async (file: File, field: 'poster_path' | 'backdrop_path') => {
    if (field === 'poster_path') setPosterUploading(true);
    else setBackdropUploading(true);
    try {
      const result = await movieApi.uploadImage(file);
      update(field, result.url);
    } catch (err: any) {
      setError(err?.message || 'Image upload failed.');
    } finally {
      setPosterUploading(false);
      setBackdropUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const now = Date.now();
      const movie: any = {
        id: now,
        title: form.title.trim(),
        description: form.overview.trim(),
        overview: form.overview.trim(),
        category: form.category,
        genre: [form.category],
        track: form.track,
        year: form.release_date ? parseInt(form.release_date) : new Date().getFullYear(),
        rating: form.vote_average ? parseFloat(form.vote_average) : 0,
        release_date: form.release_date || new Date().toISOString().slice(0, 10),
        vote_average: form.vote_average ? parseFloat(form.vote_average) : 0,
        poster_path: form.poster_path || `https://picsum.photos/seed/${now}/500/750`,
        backdrop_path: form.backdrop_path || `https://picsum.photos/seed/${now}b/1280/720`,
        imageUrl: form.poster_path || `https://picsum.photos/seed/${now}/500/750`,
        backdropUrl: form.backdrop_path || `https://picsum.photos/seed/${now}b/1280/720`,
        trailerUrl: form.videoUrl || '',
        videoUrl: form.videoUrl || '',
        duration: form.runtime ? `${form.runtime} min` : '',
        runtime: form.runtime ? parseInt(form.runtime) : 0,
        cast: [],
        trending: false,
        region: 'International',
        price: 0,
        freeEpisodeCount: 100,
        isFree: true,
        episodes: [],
        vote_count: 0,
        type: form.type,
        totalSeasons: form.type === 'series' ? parseInt(form.totalSeasons) || 1 : undefined,
        episodes_data: form.type === 'series' ? episodes : undefined,
        franchise: form.franchise || undefined,
        part: form.franchise ? 1 : undefined,
      };
      if (form.franchise && parts.length > 0) {
        for (const pt of parts) {
          const partMovie: any = {
            ...movie,
            id: Date.now() + pt.part,
            title: pt.title || `${form.title.trim()} - Part ${pt.part}`,
            part: pt.part,
            videoUrl: pt.videoUrl || '',
            description: pt.overview || form.overview.trim(),
          };
          await onAddMovie(partMovie);
        }
      } else {
        await onAddMovie(movie);
      }
      navigate('/admin/movie/movies');
    } catch (err: any) {
      setError(err?.message || 'Failed to add movie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-bBlack flex animate-fade-in font-sans text-bText">
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-bDark border-r border-bGray flex flex-col transition-all duration-300 shrink-0 overflow-y-auto`}>
        <div className={`flex items-center gap-3 border-b border-bGray/40 shrink-0 ${sidebarCollapsed ? 'justify-center px-2 py-4' : 'px-4 py-4'}`}>
          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-bYellow/20 rounded-full blur-sm" />
            <svg viewBox="0 0 40 40" className="h-9 w-9 relative" aria-hidden="true">
              <circle cx="20" cy="20" r="20" fill="#FCD535" />
              <path fill="#0B0E11" d="M15.8 12.15c0-1.02 1.12-1.64 1.98-1.1l12.35 7.55c.82.5.82 1.7 0 2.2L17.78 28.35c-.86.54-1.98-.08-1.98-1.1V12.15z" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-base font-extrabold text-bYellow tracking-wide leading-none">Orbit</h1>
                <span className="text-base font-light text-white/80 tracking-wide leading-none">Movie</span>
              </div>
              <p className="text-[8px] text-bTextSecondary uppercase tracking-[0.2em] mt-0.5">Admin Dashboard</p>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col pt-2">
          {sidebarTabs.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(`/admin/movie/${item.id}`)}
              className={`flex items-center gap-3 px-4 py-3.5 border-l-4 transition-all hover:bg-bGray/10 ${item.id === 'movies' ? 'border-bYellow text-bYellow bg-bGray/10' : 'border-transparent text-bTextSecondary hover:text-white'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              title={item.label}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {!sidebarCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-14 bg-gradient-to-r from-bDark via-[#111318] to-bDark border-b border-bGray flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-bGray/20 text-bTextSecondary hover:text-bYellow transition-all shrink-0"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">Add New {form.type === 'series' ? 'Series' : 'Movie'}</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-bBlack/40 border border-bGray/40 rounded-lg px-3 py-1.5">
              <div className="h-7 w-7 rounded-full bg-bYellow/20 border border-bYellow/40 flex items-center justify-center">
                <span className="text-xs font-bold text-bYellow">{user?.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-medium text-white leading-none">{user?.name || 'Admin'}</div>
                <div className="text-[9px] text-bTextSecondary leading-none mt-0.5">{user?.email || ''}</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/movie')}
              className="group bg-bGray/20 hover:bg-bRed/20 text-bTextSecondary hover:text-bRed px-3 py-2 rounded-lg flex items-center gap-2 transition-all border border-transparent hover:border-bRed/30"
            >
              <span className="text-xs font-medium hidden sm:inline">Exit</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-bBlack p-6">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
            {error && (
              <div className="bg-bRed/10 border border-bRed/30 rounded-lg p-4 text-bRed text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                {error}
              </div>
            )}

            <div className="bg-bDark border border-bGray rounded-lg p-6">
              <h3 className="text-sm font-bold text-bTextSecondary uppercase tracking-wider mb-4">Basic Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Title *</label>
                  <input type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Movie title"
                    className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" required />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Overview</label>
                  <textarea value={form.overview} onChange={e => update('overview', e.target.value)} placeholder="Movie description..." rows={4}
                    className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Type</label>
                  <div className="flex gap-2">
                    {(['movie', 'series'] as const).map(t => (
                      <button key={t} type="button" onClick={() => update('type', t)}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all border ${form.type === t ? 'bg-bYellow text-black border-bYellow' : 'bg-bBlack border-bGray text-bTextSecondary hover:border-bTextSecondary'}`}>
                        {t === 'movie' ? '🎬 Movie' : '📺 Series'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Category</label>
                  <select value={form.category} onChange={e => update('category', e.target.value)}
                    className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white focus:border-bYellow/50 focus:outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Track</label>
                  <select value={form.track} onChange={e => update('track', e.target.value)}
                    className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white focus:border-bYellow/50 focus:outline-none">
                    <option value="original">Original</option>
                    <option value="agasobanuye">Agasobanuye</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Release Date</label>
                  <input type="date" value={form.release_date} onChange={e => update('release_date', e.target.value)}
                    className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white focus:border-bYellow/50 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Rating (0-10)</label>
                  <input type="number" step="0.1" min="0" max="10" value={form.vote_average} onChange={e => update('vote_average', e.target.value)} placeholder="7.5"
                    className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Runtime (min)</label>
                  <input type="number" min="0" value={form.runtime} onChange={e => update('runtime', e.target.value)} placeholder="120"
                    className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                </div>

                {form.type !== 'series' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Franchise (optional)</label>
                      <input type="text" value={form.franchise} onChange={e => handleFranchiseChange(e.target.value)} placeholder="e.g. Fast Furious"
                        className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                      {form.franchise && (
                        <p className="text-[10px] text-bTextSecondary mt-1">Leave empty if this is a standalone movie</p>
                      )}
                    </div>
                  </>
                )}

                {form.type === 'series' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Total Seasons</label>
                      <input type="number" min="1" value={form.totalSeasons} onChange={e => update('totalSeasons', e.target.value)}
                        className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white focus:border-bYellow/50 focus:outline-none" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {form.type !== 'series' && form.franchise && (
            <div className="bg-bDark border border-bGray rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-bTextSecondary uppercase tracking-wider">Parts</h3>
                  <p className="text-xs text-bTextSecondary mt-1">Add each part of "{form.franchise}" with its own video</p>
                </div>
                <button type="button" onClick={addPart}
                  className="bg-bYellow text-black px-3 py-1.5 rounded text-xs font-bold hover:bg-bYellowHover flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  Add Part
                </button>
              </div>

              <div className="space-y-3">
                {parts.map((pt, idx) => (
                  <div key={idx} className={`border rounded-lg overflow-hidden transition-all ${pt.videoUrl ? 'border-bGreen/40 bg-bBlack/60' : 'border-bGray bg-bBlack'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${pt.videoUrl ? 'bg-bGreen text-white' : pt.uploading ? 'bg-bYellow/20 text-bYellow animate-pulse' : 'bg-bGray/30 text-bTextSecondary'}`}>
                        {pt.uploading ? '⏳' : pt.videoUrl ? '✓' : `P${idx + 1}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input type="text" value={pt.title} onChange={e => updatePart(idx, 'title', e.target.value)} placeholder={`Part ${idx + 1} title`}
                          className="w-full bg-transparent text-sm text-white placeholder-bTextSecondary focus:outline-none" />
                      </div>
                      <span className="text-xs text-bTextSecondary font-bold shrink-0">Part {idx + 1}</span>
                      {parts.length > 1 && (
                        <button type="button" onClick={() => removePart(idx)} className="text-bTextSecondary hover:text-bRed text-xs shrink-0" title="Remove part">✕</button>
                      )}
                    </div>
                    <div className="border-t border-bGray/50 px-4 py-3 bg-bDark/30">
                      {pt.videoUrl ? (
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-bGreen shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-xs text-bGreen truncate flex-1">{pt.videoUrl}</span>
                          <button type="button" onClick={() => updatePart(idx, 'videoUrl', '')} className="text-bTextSecondary hover:text-bRed text-xs">Remove</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input ref={el => { partInputRefs.current[idx] = el; }} type="file" accept="video/*"
                            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPartVideo(f, idx); e.target.value = ''; }} />
                          <button type="button" onClick={() => partInputRefs.current[idx]?.click()} disabled={pt.uploading}
                            className="flex items-center gap-2 border border-dashed border-bGray hover:border-bYellow/50 rounded px-3 py-2 text-xs text-bTextSecondary hover:text-bYellow transition-colors disabled:opacity-50 flex-1">
                            {pt.uploading ? (
                              <><span className="animate-spin">⏳</span> Uploading video...</>
                            ) : (
                              <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> Upload video</>
                            )}
                          </button>
                          <input type="text" value={pt.overview} onChange={e => updatePart(idx, 'overview', e.target.value)} placeholder="Description (optional)"
                            className="flex-1 bg-bBlack border border-bGray rounded px-2 py-1 text-xs text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {form.type !== 'series' && !form.franchise && (
            <div className="bg-bDark border border-bGray rounded-lg p-6">
              <h3 className="text-sm font-bold text-bTextSecondary uppercase tracking-wider mb-4">Video</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Video URL</label>
                  <input type="text" value={form.videoUrl} onChange={e => update('videoUrl', e.target.value)} placeholder="https://... or /uploads/..."
                    className="w-full bg-bBlack border border-bGray rounded-lg px-4 py-3 text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-bGray" />
                  <span className="text-xs text-bTextSecondary uppercase">or</span>
                  <div className="h-px flex-1 bg-bGray" />
                </div>
                <div>
                  <input ref={videoInputRef} type="file" accept="video/*"
                    style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadVideo(f); e.target.value = ''; }} />
                  <button type="button" onClick={() => videoInputRef.current?.click()} disabled={videoUploading}
                    className="w-full border-2 border-dashed border-bGray hover:border-bYellow/50 rounded-lg px-6 py-8 flex flex-col items-center gap-2 transition-colors disabled:opacity-50">
                    {videoUploading ? (
                      <><span className="animate-spin text-2xl">⏳</span><span className="text-sm text-bTextSecondary">Uploading video...</span></>
                    ) : (
                      <><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-bTextSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg><span className="text-sm text-bTextSecondary">Click to upload video (MP4, WebM, up to 2GB)</span></>
                    )}
                  </button>
                </div>
                {form.videoUrl && (
                  <div className="bg-bBlack rounded-lg p-3 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bGreen shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-white truncate flex-1">{form.videoUrl}</span>
                    <button type="button" onClick={() => update('videoUrl', '')} className="text-bTextSecondary hover:text-bRed text-xs">Remove</button>
                  </div>
                )}
              </div>
            </div>
            )}

            <div className="bg-bDark border border-bGray rounded-lg p-6">
              <h3 className="text-sm font-bold text-bTextSecondary uppercase tracking-wider mb-4">Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Poster</label>
                  <input ref={posterInputRef} type="file" accept="image/*"
                    style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, 'poster_path'); e.target.value = ''; }} />
                  {form.poster_path ? (
                    <div className="relative group">
                      <img src={form.poster_path} alt="Poster" className="w-full h-64 rounded-lg object-cover border border-bGray" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                        <button type="button" onClick={() => posterInputRef.current?.click()} disabled={posterUploading}
                          className="bg-bYellow text-black px-4 py-2 rounded text-sm font-bold hover:bg-bYellowHover disabled:opacity-50">
                          {posterUploading ? 'Uploading...' : 'Change'}
                        </button>
                        <button type="button" onClick={() => update('poster_path', '')}
                          className="bg-bRed text-white px-4 py-2 rounded text-sm font-bold hover:bg-bRed/80">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => posterInputRef.current?.click()} disabled={posterUploading}
                      className="w-full border-2 border-dashed border-bGray hover:border-bYellow/50 rounded-lg px-4 py-12 flex flex-col items-center gap-2 transition-colors disabled:opacity-50">
                      {posterUploading ? (
                        <span className="text-sm text-bTextSecondary">Uploading...</span>
                      ) : (
                        <><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-bTextSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm text-bTextSecondary">Upload poster image</span></>
                      )}
                    </button>
                  )}
                  <div className="mt-2">
                    <input type="text" value={form.poster_path} onChange={e => update('poster_path', e.target.value)} placeholder="Or paste poster URL..."
                      className="w-full bg-bBlack border border-bGray rounded px-3 py-2 text-xs text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-bTextSecondary uppercase tracking-wider mb-2">Backdrop</label>
                  <input ref={backdropInputRef} type="file" accept="image/*"
                    style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, 'backdrop_path'); e.target.value = ''; }} />
                  {form.backdrop_path ? (
                    <div className="relative group">
                      <img src={form.backdrop_path} alt="Backdrop" className="w-full h-64 rounded-lg object-cover border border-bGray" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                        <button type="button" onClick={() => backdropInputRef.current?.click()} disabled={backdropUploading}
                          className="bg-bYellow text-black px-4 py-2 rounded text-sm font-bold hover:bg-bYellowHover disabled:opacity-50">
                          {backdropUploading ? 'Uploading...' : 'Change'}
                        </button>
                        <button type="button" onClick={() => update('backdrop_path', '')}
                          className="bg-bRed text-white px-4 py-2 rounded text-sm font-bold hover:bg-bRed/80">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => backdropInputRef.current?.click()} disabled={backdropUploading}
                      className="w-full border-2 border-dashed border-bGray hover:border-bYellow/50 rounded-lg px-4 py-12 flex flex-col items-center gap-2 transition-colors disabled:opacity-50">
                      {backdropUploading ? (
                        <span className="text-sm text-bTextSecondary">Uploading...</span>
                      ) : (
                        <><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-bTextSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm text-bTextSecondary">Upload backdrop image</span></>
                      )}
                    </button>
                  )}
                  <div className="mt-2">
                    <input type="text" value={form.backdrop_path} onChange={e => update('backdrop_path', e.target.value)} placeholder="Or paste backdrop URL..."
                      className="w-full bg-bBlack border border-bGray rounded px-3 py-2 text-xs text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>

            {form.type === 'series' && (
              <div className="bg-bDark border border-bGray rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-bTextSecondary uppercase tracking-wider">Episodes</h3>
                    <p className="text-xs text-bTextSecondary mt-1">Upload a video for each episode like a course</p>
                  </div>
                  <button type="button" onClick={addEpisode}
                    className="bg-bYellow text-black px-3 py-1.5 rounded text-xs font-bold hover:bg-bYellowHover flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Add Episode
                  </button>
                </div>

                <div className="space-y-3">
                  {episodes.map((ep, idx) => (
                    <div key={idx} className={`border rounded-lg overflow-hidden transition-all ${ep.videoUrl ? 'border-bGreen/40 bg-bBlack/60' : 'border-bGray bg-bBlack'}`}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ep.videoUrl ? 'bg-bGreen text-white' : ep.uploading ? 'bg-bYellow/20 text-bYellow animate-pulse' : 'bg-bGray/30 text-bTextSecondary'}`}>
                          {ep.uploading ? '⏳' : ep.videoUrl ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input type="text" value={ep.title} onChange={e => updateEpisode(idx, 'title', e.target.value)} placeholder={`Episode ${idx + 1} title`}
                            className="w-full bg-transparent text-sm text-white placeholder-bTextSecondary focus:outline-none" />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input type="number" min="1" value={ep.season} onChange={e => updateEpisode(idx, 'season', parseInt(e.target.value) || 1)} placeholder="S"
                            className="w-12 bg-bDark border border-bGray rounded px-2 py-1 text-xs text-white text-center focus:border-bYellow/50 focus:outline-none" title="Season" />
                          <input type="number" min="1" value={ep.episode} onChange={e => updateEpisode(idx, 'episode', parseInt(e.target.value) || 1)} placeholder="E"
                            className="w-12 bg-bDark border border-bGray rounded px-2 py-1 text-xs text-white text-center focus:border-bYellow/50 focus:outline-none" title="Episode" />
                        </div>
                        {episodes.length > 1 && (
                          <button type="button" onClick={() => removeEpisode(idx)} className="text-bTextSecondary hover:text-bRed text-xs shrink-0" title="Remove episode">✕</button>
                        )}
                      </div>
                      <div className="border-t border-bGray/50 px-4 py-3 bg-bDark/30">
                        {ep.videoUrl ? (
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-bGreen shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span className="text-xs text-bGreen truncate flex-1">{ep.videoUrl}</span>
                            <button type="button" onClick={() => updateEpisode(idx, 'videoUrl', '')} className="text-bTextSecondary hover:text-bRed text-xs">Remove</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input ref={el => { episodeInputRefs.current[idx] = el; }} type="file" accept="video/*"
                              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadVideo(f, idx); e.target.value = ''; }} />
                            <button type="button" onClick={() => episodeInputRefs.current[idx]?.click()} disabled={ep.uploading}
                              className="flex items-center gap-2 border border-dashed border-bGray hover:border-bYellow/50 rounded px-3 py-2 text-xs text-bTextSecondary hover:text-bYellow transition-colors disabled:opacity-50 flex-1">
                              {ep.uploading ? (
                                <><span className="animate-spin">⏳</span> Uploading video...</>
                              ) : (
                                <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> Upload video</>
                              )}
                            </button>
                            <input type="text" value={ep.overview} onChange={e => updateEpisode(idx, 'overview', e.target.value)} placeholder="Description (optional)"
                              className="flex-1 bg-bBlack border border-bGray rounded px-2 py-1 text-xs text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-bGray">
              <button type="submit" disabled={loading}
                className="bg-bYellow text-black px-8 py-3 rounded-lg font-bold hover:bg-bYellowHover disabled:opacity-50 flex items-center gap-2">
                {loading ? (
                  <><span className="animate-spin">⏳</span> Adding...</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg> Add {form.type === 'series' ? 'Series' : 'Movie'}</>
                )}
              </button>
              <button type="button" onClick={() => navigate('/admin/movie')} className="bg-bGray text-white px-6 py-3 rounded-lg hover:bg-bGray/80 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMoviePage;
