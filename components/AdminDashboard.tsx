
import React, { useState, useEffect } from 'react';
import { Movie, User, Episode } from '../types';
import { api as movieApi } from '../services/shopApi';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  onAddMovie: (movie: Movie) => void;
  onUpdateMovie: (movie: Movie) => void;
  onDeleteMovie: (id: number) => void;
}

// Simulated Mock Users
const MOCK_USERS: User[] = [
  { id: '101', name: 'CryptoWhale', email: 'whale@binance.com', isVip: true, isAdmin: false },
  { id: '102', name: 'HodlerOne', email: 'hodl@mail.com', isVip: false, isAdmin: false },
  { id: '103', name: 'AdminUser', email: 'admin@movieexchange.com', isVip: true, isAdmin: true },
  { id: '104', name: 'NewbieTrade', email: 'new@trade.com', isVip: false, isAdmin: false },
  { id: '105', name: 'MoonShot', email: 'moon@rocket.com', isVip: true, isAdmin: false },
];

const QUALITIES = ['360p', '480p', '720p', '1080p', '2K', '4K'];
const REGIONS = ['International', 'Indundi', 'Inyarwanda', 'Tanzanie', 'Ingande', 'Burundi', 'Kenya', 'Uganda'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, movies, onAddMovie, onUpdateMovie, onDeleteMovie }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'users' | 'settings'>('overview');
  
  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // Movie Management State
  const [movieSearch, setMovieSearch] = useState('');
  const [movieSort, setMovieSort] = useState<{key: keyof Movie | 'views', dir: 'asc'|'desc'}>({ key: 'id', dir: 'desc' });
  const [moviePage, setMoviePage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  
  // Add/Edit Sidebar State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [movieForm, setMovieForm] = useState<Partial<Movie>>({});
  const [formEpisodes, setFormEpisodes] = useState<Episode[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [trailerUploading, setTrailerUploading] = useState(false);

  // Mock User State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  // Initialize Form
  const resetForm = () => {
    setMovieForm({
      title: '', description: '', year: new Date().getFullYear(), rating: 0, genre: ['Action'],
      imageUrl: 'https://picsum.photos/300/450', backdropUrl: 'https://picsum.photos/1280/720',
      trailerUrl: '', price: 0, duration: '90 min', region: 'International', isFree: true
    });
    setFormEpisodes([]);
    setEditingId(null);
  };

  // Toast Logic
  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter & Sort Movies
  const filteredMovies = movies
    .filter(m => m.title.toLowerCase().includes(movieSearch.toLowerCase()) || m.genre?.some(g => g.toLowerCase().includes(movieSearch.toLowerCase())))
    .sort((a, b) => {
      const valA = a[movieSort.key as keyof Movie] ?? 0;
      const valB = b[movieSort.key as keyof Movie] ?? 0;
      if (valA < valB) return movieSort.dir === 'asc' ? -1 : 1;
      if (valA > valB) return movieSort.dir === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const paginatedMovies = filteredMovies.slice((moviePage - 1) * ITEMS_PER_PAGE, moviePage * ITEMS_PER_PAGE);

  const handleSaveMovie = (e: React.FormEvent) => {
    e.preventDefault();
    const baseMovie: Movie = {
      id: editingId || Date.now(),
      title: movieForm.title || 'Untitled',
      description: movieForm.description || '',
      year: movieForm.year || 2024,
      rating: movieForm.rating || 0,
      genre: movieForm.genre || ['Action'],
      imageUrl: movieForm.imageUrl || '',
      backdropUrl: movieForm.backdropUrl || '',
      trailerUrl: movieForm.trailerUrl,
      duration: movieForm.duration || '90 min',
      cast: movieForm.cast || ['Unknown'],
      price: movieForm.price || 0,
      isFree: movieForm.isFree,
      region: movieForm.region || 'International',
      trending: movieForm.trending || false,
      episodes: formEpisodes // Attach the managed episodes
    };

    if (editingId) {
      onUpdateMovie(baseMovie);
      showToast(`Updated "${baseMovie.title}" successfully.`);
    } else {
      onAddMovie(baseMovie);
      showToast(`Added "${baseMovie.title}" to catalog.`);
    }
    setIsEditorOpen(false);
    resetForm();
  };

  const handleEditClick = (movie: Movie) => {
    setMovieForm({ ...movie });
    setFormEpisodes(movie.episodes || []);
    setEditingId(movie.id);
    setIsEditorOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this asset?')) {
      onDeleteMovie(id);
      showToast('Asset deleted.');
    }
  };

  const handleUserAction = (userId: string, action: 'ban' | 'vip') => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        if (action === 'vip') return { ...u, isVip: !u.isVip };
        if (action === 'ban') return { ...u, name: `[BANNED] ${u.name}` };
      }
      return u;
    }));
    showToast(`User ${action === 'vip' ? 'VIP status toggled' : 'banned'}.`);
  };

  // --- Episode Management Functions ---
  const addEpisode = () => {
    const isAgasobanuye = movieForm.genre?.includes('Izisobanuye');
    const isSeries = movieForm.genre?.includes('Series');
    const label = isSeries ? 'Episode' : 'Part';
    
    const newEp: Episode = {
      id: Date.now().toString(),
      title: `${label} ${formEpisodes.length + 1}`,
      url: '',
      quality: '1080p',
      isFree: formEpisodes.length === 0
    };
    setFormEpisodes([...formEpisodes, newEp]);
  };

  const removeEpisode = (index: number) => {
    const newEps = [...formEpisodes];
    newEps.splice(index, 1);
    setFormEpisodes(newEps);
  };

  const updateEpisode = (index: number, field: keyof Episode, value: any) => {
    const newEps = [...formEpisodes];
    newEps[index] = { ...newEps[index], [field]: value };
    setFormEpisodes(newEps);
  };

  const handleUploadVideo = async (file: File, targetIdx: number | 'trailer') => {
    if (targetIdx === 'trailer') setTrailerUploading(true);
    else setUploadingIdx(targetIdx);
    try {
      const result = await movieApi.uploadVideo(file);
      if (targetIdx === 'trailer') {
        setMovieForm({ ...movieForm, trailerUrl: result.url });
      } else {
        updateEpisode(targetIdx, 'url', result.url);
      }
      showToast('Video uploaded successfully');
    } catch (err) {
      showToast('Upload failed', 'error');
    } finally {
      setTrailerUploading(false);
      setUploadingIdx(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, targetIdx: number | 'trailer') => {
    const file = e.target.files?.[0];
    if (file) handleUploadVideo(file, targetIdx);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-bBlack flex flex-col animate-fade-in font-sans text-bText">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded shadow-xl z-[100] animate-slide-up flex items-center gap-3 ${notification.type === 'success' ? 'bg-bGreen text-black' : 'bg-bRed text-white'}`}>
           <span className="font-bold">{notification.type === 'success' ? '✓' : '⚠'}</span>
           {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="h-16 bg-bDark border-b border-bGray flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
           <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
             <circle cx="20" cy="20" r="20" fill="#FCD535" />
             <path fill="#0B0E11" d="M15.8 12.15c0-1.02 1.12-1.64 1.98-1.1l12.35 7.55c.82.5.82 1.7 0 2.2L17.78 28.35c-.86.54-1.98-.08-1.98-1.1V12.15z" />
           </svg>
           <div>
             <h1 className="text-lg font-bold text-bYellow tracking-wide">Orbit Movie</h1>
             <p className="text-[10px] text-bTextSecondary uppercase tracking-widest">Admin Dashboard</p>
           </div>
        </div>
        <button onClick={onClose} className="bg-bGray/20 hover:bg-bRed/20 hover:text-bRed text-bTextSecondary px-4 py-2 rounded flex items-center gap-2 transition-all">
           <span>Exit Dashboard</span>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Nav */}
        <div className="w-64 bg-bDark border-r border-bGray flex flex-col pt-4">
           {[
             { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
             { id: 'movies', label: 'Asset Management', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
             { id: 'users', label: 'User Base', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
             { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
           ].map(item => (
             <button 
               key={item.id}
               onClick={() => setActiveTab(item.id as any)}
               className={`flex items-center gap-3 px-6 py-4 border-l-4 transition-all hover:bg-bGray/10 ${activeTab === item.id ? 'border-bYellow text-bYellow bg-bGray/10' : 'border-transparent text-bTextSecondary hover:text-white'}`}
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="font-medium text-sm">{item.label}</span>
             </button>
           ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-bBlack p-8">
           
           {/* OVERVIEW TAB */}
           {activeTab === 'overview' && (
             <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   {[
                     { label: 'Total Movies', val: movies.length, change: '+5', color: 'bYellow' },
                     { label: 'Total Users', val: '14,502', change: '+12%', color: 'bGreen' },
                     { label: 'Revenue (24h)', val: '$4,290', change: '-2%', color: 'bRed' },
                     { label: 'Active Viewers', val: '892', change: '+8%', color: 'bGreen' }
                   ].map((stat, idx) => (
                     <div key={idx} className="bg-bDark p-6 rounded-lg border border-bGray hover:border-bTextSecondary/50 transition-colors">
                        <div className="text-bTextSecondary text-xs uppercase font-bold tracking-wider mb-2">{stat.label}</div>
                        <div className="text-3xl font-bold text-white mb-2">{stat.val}</div>
                        <div className={`text-xs font-bold ${stat.color === 'bRed' ? 'text-bRed' : 'text-bGreen'}`}>{stat.change} <span className="text-bTextSecondary font-normal opacity-70">vs last period</span></div>
                     </div>
                   ))}
                </div>

                {/* Shop Products Section */}
                <div>
                   <h3 className="text-lg font-bold text-white mb-4">Shop Products</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { name: 'Orbit Movie Hoodie', price: '$25', stock: 40, img: 'https://picsum.photos/seed/hoodie/200/200' },
                        { name: 'Agasobanuye T-Shirt', price: '$12', stock: 80, img: 'https://picsum.photos/seed/tshirt/200/200' },
                        { name: 'USB Film Bundle 64GB', price: '$18', stock: 25, img: 'https://picsum.photos/seed/usb/200/200' },
                        { name: 'VIP Weekend Bundle', price: '$35', stock: 15, img: 'https://picsum.photos/seed/bundle/200/200' }
                      ].map((product, idx) => (
                        <div key={idx} className="bg-bDark border border-bGray rounded-lg overflow-hidden hover:border-bYellow/50 transition-colors">
                           <img src={product.img} alt={product.name} className="w-full h-32 object-cover" />
                           <div className="p-3">
                              <p className="text-white text-sm font-bold truncate">{product.name}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-bYellow font-bold">{product.price}</span>
                                <span className="text-[10px] text-bTextSecondary">{product.stock} in stock</span>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {/* MOVIES TAB */}
           {activeTab === 'movies' && (
             <div className="animate-fade-in flex flex-col h-full">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h2 className="text-2xl font-bold text-white">Asset Management</h2>
                   <p className="text-xs text-bTextSecondary mt-1">Manage movies, series, episodes, and qualities.</p>
                 </div>
                 <button 
                   onClick={() => { resetForm(); setIsEditorOpen(true); }}
                   className="bg-bYellow text-black px-4 py-2 rounded font-bold hover:bg-bYellowHover flex items-center gap-2 shadow-lg shadow-bYellow/20"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                   </svg>
                   New Asset
                 </button>
               </div>

               {/* Toolbar */}
               <div className="flex gap-4 mb-4">
                  <div className="relative flex-1 max-w-md">
                     <input 
                       type="text" 
                       placeholder="Search by title, genre or region..." 
                       value={movieSearch}
                       onChange={(e) => { setMovieSearch(e.target.value); setMoviePage(1); }}
                       className="w-full bg-bDark border border-bGray rounded px-4 py-2 text-sm text-white focus:border-bYellow focus:outline-none pl-10"
                     />
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-bTextSecondary absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                     </svg>
                  </div>
               </div>

               {/* Table */}
               <div className="bg-bDark border border-bGray rounded-lg overflow-hidden flex-1 flex flex-col">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap">
                     <thead className="bg-bGray/20 text-xs uppercase text-bTextSecondary font-bold border-b border-bGray">
                       <tr>
                         <th className="px-6 py-4">Asset</th>
                         <th className="px-6 py-4">Region</th>
                         <th className="px-6 py-4">Type</th>
                         <th className="px-6 py-4">Parts</th>
                         <th className="px-6 py-4">Price</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-bGray/10">
                       {paginatedMovies.length > 0 ? paginatedMovies.map(movie => (
                         <tr key={movie.id} className="hover:bg-bGray/10 transition-colors group">
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                               <img src={movie.imageUrl} className="w-8 h-12 object-cover rounded bg-bGray" alt="" />
                               <div>
                                 <div className="text-white font-medium text-sm truncate max-w-[200px]">{movie.title}</div>
                                 <div className="text-[10px] text-bTextSecondary">{movie.year} • ★ {movie.rating}</div>
                               </div>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                              {movie.region ? <span className="bg-bGray/30 text-bText px-2 py-0.5 rounded text-xs border border-bGray">{movie.region}</span> : <span className="text-bTextSecondary text-xs">-</span>}
                           </td>
                           <td className="px-6 py-4 text-bTextSecondary text-sm">
                              <span className="bg-bBlack px-2 py-1 rounded border border-bGray text-xs">{movie.genre[0]}</span>
                           </td>
                           <td className="px-6 py-4 text-sm text-bTextSecondary">
                              {movie.episodes?.length || 0} Files
                           </td>
                           <td className="px-6 py-4 text-white text-sm font-mono">{movie.isFree ? <span className="text-bGreen">FREE</span> : `$${movie.price}`}</td>
                           <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleEditClick(movie)} className="px-3 py-1 bg-bYellow text-black rounded text-xs font-bold hover:bg-bYellowHover">
                                  Edit
                               </button>
                               <button onClick={() => handleDeleteClick(movie.id)} className="p-1.5 hover:bg-bGray rounded text-bRed" title="Delete">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                               </button>
                             </div>
                           </td>
                         </tr>
                       )) : (
                         <tr><td colSpan={6} className="text-center py-8 text-bTextSecondary">No assets found.</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
                 
                 {/* Pagination */}
                 <div className="p-4 border-t border-bGray bg-bBlack/20 flex justify-between items-center">
                    <span className="text-xs text-bTextSecondary">Page {moviePage} of {totalPages}</span>
                    <div className="flex gap-2">
                       <button disabled={moviePage === 1} onClick={() => setMoviePage(p => p-1)} className="flex items-center gap-1 px-3 py-1 bg-bGray/50 rounded text-xs hover:bg-bGray disabled:opacity-50">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                         </svg>
                         Prev
                       </button>
                       <button disabled={moviePage === totalPages} onClick={() => setMoviePage(p => p+1)} className="flex items-center gap-1 px-3 py-1 bg-bGray/50 rounded text-xs hover:bg-bGray disabled:opacity-50">
                         Next
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                       </button>
                     </div>
                 </div>
               </div>
             </div>
           )}

           {/* USERS TAB */}
           {activeTab === 'users' && (
             <div className="animate-fade-in">
                {/* ... (User table kept same) ... */}
                <h2 className="text-2xl font-bold text-white mb-6">User Database</h2>
                {/* ... existing user table code ... */}
                <div className="bg-bDark border border-bGray rounded-lg overflow-hidden">
                   <table className="w-full text-left">
                     <thead className="bg-bGray/20 text-xs uppercase text-bTextSecondary font-bold border-b border-bGray">
                       <tr>
                         <th className="px-6 py-4">User Info</th>
                         <th className="px-6 py-4">Role</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Controls</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-bGray/10">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-bGray/10 transition-colors">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-bGray flex items-center justify-center text-xs font-bold">{u.name.charAt(0)}</div>
                                   <div>
                                     <div className="text-white text-sm font-bold">{u.name}</div>
                                     <div className="text-[10px] text-bTextSecondary">{u.email}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                {u.isAdmin ? <span className="bg-bRed/20 text-bRed px-2 py-0.5 rounded text-xs font-bold border border-bRed/30">ADMIN</span> : 
                                 u.isVip ? <span className="bg-bYellow/20 text-bYellow px-2 py-0.5 rounded text-xs font-bold border border-bYellow/30">VIP</span> :
                                 <span className="text-bTextSecondary text-xs">Standard</span>}
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5">
                                   <div className="w-2 h-2 rounded-full bg-bGreen"></div>
                                   <span className="text-xs text-bText">Active</span>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                   <button onClick={() => handleUserAction(u.id, 'vip')} className="text-xs bg-bGray hover:bg-bYellow hover:text-black px-2 py-1 rounded">Toggle VIP</button>
                                   <button onClick={() => handleUserAction(u.id, 'ban')} className="text-xs bg-bGray hover:bg-bRed hover:text-white px-2 py-1 rounded">Ban</button>
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
             </div>
           )}

           {/* SETTINGS TAB */}
           {activeTab === 'settings' && (
              <div className="animate-fade-in max-w-2xl">
                 <h2 className="text-2xl font-bold text-white mb-6">Platform Settings</h2>
                 <div className="bg-bDark border border-bGray rounded-lg p-6 space-y-6">
                    <div className="flex items-center justify-between">
                       <div>
                          <h4 className="text-white font-bold">Maintenance Mode</h4>
                          <p className="text-xs text-bTextSecondary">Disable platform access for non-admins.</p>
                       </div>
                       <div className="w-12 h-6 bg-bGray rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div></div>
                    </div>
                    <div className="border-t border-bGray pt-6">
                       <h4 className="text-white font-bold mb-4">Media Server Configuration</h4>
                       <div className="space-y-3">
                          <label className="text-xs text-bTextSecondary block">Media Server Endpoint</label>
                          <input type="text" value="https://stream.movieexchange.io/v1/cdn" disabled className="w-full bg-bBlack border border-bGray rounded p-2 text-sm text-bText" />
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Editor Sidebar (Slide-in) */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-bDark shadow-2xl border-l border-bGray transform transition-transform duration-300 z-[90] ${isEditorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="h-full flex flex-col">
              <div className="p-6 border-b border-bGray flex items-center justify-between bg-bBlack/20">
                 <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Asset' : 'New Asset'}</h2>
                 <button onClick={() => setIsEditorOpen(false)} className="text-bTextSecondary hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* Basic Info */}
                 <div className="space-y-4">
                    <div>
                       <label className="text-xs text-bTextSecondary uppercase font-bold block mb-1">Title</label>
                       <input 
                         type="text" required 
                         value={movieForm.title} 
                         onChange={e => setMovieForm({...movieForm, title: e.target.value})}
                         className="w-full bg-bBlack border border-bGray rounded p-3 text-white text-sm focus:border-bYellow outline-none" 
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs text-bTextSecondary uppercase font-bold block mb-1">Region</label>
                          <select 
                             value={movieForm.region} 
                             onChange={e => setMovieForm({...movieForm, region: e.target.value})}
                             className="w-full bg-bBlack border border-bGray rounded p-3 text-white text-sm focus:border-bYellow outline-none"
                          >
                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs text-bTextSecondary uppercase font-bold block mb-1">Type/Genre</label>
                          <select 
                             value={movieForm.genre?.[0]} 
                             onChange={e => setMovieForm({...movieForm, genre: [e.target.value]})}
                             className="w-full bg-bBlack border border-bGray rounded p-3 text-white text-sm focus:border-bYellow outline-none"
                          >
                            {['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Romance', 'Documentary', 'Izisobanuye', 'Series'].map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-bTextSecondary uppercase font-bold block mb-1">Price (USDT)</label>
                          <input 
                            type="number" step="0.01"
                            value={movieForm.price} 
                            onChange={e => setMovieForm({...movieForm, price: parseFloat(e.target.value)})}
                            className="w-full bg-bBlack border border-bGray rounded p-3 text-white text-sm focus:border-bYellow outline-none" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-bTextSecondary uppercase font-bold block mb-1">Rating</label>
                          <input 
                            type="number" step="0.1" max="5"
                            value={movieForm.rating} 
                            onChange={e => setMovieForm({...movieForm, rating: parseFloat(e.target.value)})}
                            className="w-full bg-bBlack border border-bGray rounded p-3 text-white text-sm focus:border-bYellow outline-none" 
                          />
                        </div>
                    </div>
                    <div>
                       <label className="text-xs text-bTextSecondary uppercase font-bold block mb-1">Description</label>
                       <textarea 
                         rows={3} 
                         value={movieForm.description} 
                         onChange={e => setMovieForm({...movieForm, description: e.target.value})}
                         className="w-full bg-bBlack border border-bGray rounded p-3 text-white text-sm focus:border-bYellow outline-none" 
                       />
                    </div>
                 </div>

                  {/* Media URLs */}
                  <div className="space-y-4 border-t border-bGray pt-4">
                     <h3 className="text-sm font-bold text-white uppercase">Graphics</h3>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-bTextSecondary uppercase font-bold block mb-1">Poster URL</label>
                            <input 
                              type="text"
                              value={movieForm.imageUrl} 
                              onChange={e => setMovieForm({...movieForm, imageUrl: e.target.value})}
                              className="w-full bg-bBlack border border-bGray rounded p-2 text-white text-xs focus:border-bYellow outline-none" 
                            />
                         </div>
                         <div>
                            <label className="text-xs text-bTextSecondary uppercase font-bold block mb-1">Backdrop URL</label>
                            <input 
                              type="text"
                              value={movieForm.backdropUrl} 
                              onChange={e => setMovieForm({...movieForm, backdropUrl: e.target.value})}
                              className="w-full bg-bBlack border border-bGray rounded p-2 text-white text-xs focus:border-bYellow outline-none" 
                            />
                         </div>
                     </div>
                     <h3 className="text-sm font-bold text-white uppercase pt-2">Trailer</h3>
                     <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          placeholder="Trailer URL"
                          value={movieForm.trailerUrl || ''} 
                          onChange={e => setMovieForm({...movieForm, trailerUrl: e.target.value})}
                          className="flex-1 bg-bBlack border border-bGray rounded p-2 text-white text-xs focus:border-bYellow outline-none" 
                        />
                        <label className="text-[10px] bg-bGray hover:bg-bYellow hover:text-black text-white px-3 py-2 rounded cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                           </svg>
                           {trailerUploading ? 'Uploading...' : 'Upload'}
                        </label>
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileInput(e, 'trailer')} />
                     </div>
                  </div>

                 {/* Content Files Management */}
                 <div className="space-y-4 border-t border-bGray pt-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white uppercase">Content Source & Parts</h3>
                        <button onClick={addEpisode} className="text-xs bg-bGray px-2 py-1 rounded text-white hover:text-bYellow border border-bGray">
                           + Add Part
                        </button>
                     </div>
                     
                     <div className="space-y-2">
                        {formEpisodes.map((ep, idx) => (
                           <div key={idx} className="bg-bBlack border border-bGray p-3 rounded flex flex-col gap-2">
                              <div className="flex gap-2">
                                 <input 
                                    type="text" 
                                    placeholder="Title (e.g. Ep 1)"
                                    value={ep.title}
                                    onChange={(e) => updateEpisode(idx, 'title', e.target.value)}
                                    className="flex-1 bg-bDark border border-bGray rounded px-2 py-1 text-xs text-white"
                                 />
                                 <select 
                                    value={ep.quality}
                                    onChange={(e) => updateEpisode(idx, 'quality', e.target.value)}
                                    className="w-20 bg-bDark border border-bGray rounded px-1 py-1 text-xs text-white"
                                 >
                                    {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
                                 </select>
                                 <button onClick={() => removeEpisode(idx)} className="text-bRed hover:text-white px-2">✕</button>
                              </div>
                               <input 
                                  type="text"
                                  placeholder="Video Source URL"
                                  value={ep.url}
                                  onChange={(e) => updateEpisode(idx, 'url', e.target.value)}
                                  className="w-full bg-bDark border border-bGray rounded px-2 py-1 text-xs text-white"
                               />
                               <div className="flex items-center gap-2">
                                  <label className="text-[10px] bg-bGray hover:bg-bYellow hover:text-black text-white px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                     </svg>
                                     {uploadingIdx === idx ? 'Uploading...' : 'Upload Video'}
                                  </label>
                                  <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileInput(e, idx)} />
                               </div>
                              <div className="flex items-center gap-2">
                                 <input 
                                    type="checkbox"
                                    id={`free-${idx}`}
                                    checked={ep.isFree}
                                    onChange={(e) => updateEpisode(idx, 'isFree', e.target.checked)}
                                    className="accent-bGreen"
                                 />
                                 <label htmlFor={`free-${idx}`} className="text-xs text-bTextSecondary cursor-pointer">Free Preview</label>
                              </div>
                           </div>
                        ))}
                        {formEpisodes.length === 0 && (
                           <div className="text-center py-4 text-xs text-bTextSecondary border border-dashed border-bGray rounded">
                              No content files added. Click "+ Add Part" to upload episodes or movies.
                           </div>
                        )}
                     </div>
                 </div>
              </div>

              <div className="p-6 border-t border-bGray bg-bBlack/20">
                 <button 
                   onClick={handleSaveMovie} 
                   className="w-full py-3 rounded bg-bYellow text-black font-bold hover:bg-bYellowHover transition-colors shadow-lg shadow-bYellow/20"
                 >
                   {editingId ? 'Save Changes' : 'Publish Asset'}
                 </button>
              </div>
           </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
