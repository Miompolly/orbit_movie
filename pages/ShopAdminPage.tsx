
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, User, ShopOrder, Category, Comment, Episode } from '../types';
import { formatFrw, statusLabel } from '../services/shopService';
import { api as movieApi } from '../services/shopApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface ShopAdminPageProps {
  user: any;
  orders: ShopOrder[];
  movies: Movie[];
  categories: Category[];
  users: User[];
  comments: Comment[];
  onOpenAuth: () => void;
  onLogout: () => void;
  onUpdateOrder: (order: ShopOrder) => void;
  onUpdateMovie?: (movie: Movie) => void;
}

type AdminTab = 'overview' | 'orders' | 'movies' | 'reports' | 'customers' | 'support';

const CHART_COLORS = ['#FCD535', '#0ECB81', '#F6465D', '#3B82F6', '#A855F7', '#F97316', '#14B8A6', '#EC4899', '#8B5CF6', '#6366F1'];
const PIE_COLORS = ['#FCD535', '#0ECB81', '#F6465D', '#3B82F6', '#A855F7', '#F97316', '#14B8A6', '#EC4899', '#8B5CF6', '#6366F1', '#10B981', '#EF4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bDark border border-bGray rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-bTextSecondary mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

const ShopAdminPage: React.FC<ShopAdminPageProps> = ({
  user,
  orders,
  movies,
  categories,
  users,
  comments,
  onOpenAuth,
  onLogout,
  onUpdateOrder,
  onUpdateMovie
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [movieSearch, setMovieSearch] = useState('');
  const [movieGenreFilter, setMovieGenreFilter] = useState('All');
  const [movieTrackFilter, setMovieTrackFilter] = useState<'all' | 'agasobanuye' | 'original'>('all');
  const [movieViewMode, setMovieViewMode] = useState<'grid' | 'table'>('grid');
  const [commentSearch, setCommentSearch] = useState('');
  const [reportPeriod, setReportPeriod] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [selectedSeries, setSelectedSeries] = useState<Movie | null>(null);
  const [seriesEpisodes, setSeriesEpisodes] = useState<Episode[]>([]);
  const [newEpisode, setNewEpisode] = useState({ title: '', season: 1, episode: 1, videoUrl: '', overview: '' });
  const [episodeUploading, setEpisodeUploading] = useState(false);
  const episodeFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) onOpenAuth();
  }, [user]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const openSeries = (movie: Movie) => {
    if (movie.type !== 'series' && (!movie.episodes || movie.episodes.length === 0)) return;
    setSelectedSeries(movie);
    setSeriesEpisodes(movie.episodes || []);
    setNewEpisode({ title: '', season: 1, episode: (movie.episodes?.length || 0) + 1, videoUrl: '', overview: '' });
  };

  const handleEpisodeUpload = async (file: File) => {
    setEpisodeUploading(true);
    try {
      const result = await movieApi.uploadVideo(file);
      setNewEpisode(prev => ({ ...prev, videoUrl: result.url }));
    } catch (err: any) {
      showToast(err?.message || 'Upload failed', 'error');
    } finally {
      setEpisodeUploading(false);
    }
  };

  const handleAddEpisode = () => {
    if (!selectedSeries || !onUpdateMovie) return;
    const ep: Episode = {
      id: `ep-${selectedSeries.id}-${Date.now()}`,
      title: newEpisode.title || `Episode ${newEpisode.episode}`,
      url: newEpisode.videoUrl,
      quality: '1080p',
      isFree: true,
      duration: '',
      season: newEpisode.season
    };
    const updated = { ...selectedSeries, episodes: [...seriesEpisodes, ep] };
    setSeriesEpisodes(updated.episodes!);
    setSelectedSeries(updated);
    onUpdateMovie(updated);
    setNewEpisode({ title: '', season: newEpisode.season, episode: newEpisode.episode + 1, videoUrl: '', overview: '' });
    showToast('Episode added');
  };

  const handleRemoveEpisode = (idx: number) => {
    if (!selectedSeries || !onUpdateMovie) return;
    const updated = { ...selectedSeries, episodes: seriesEpisodes.filter((_, i) => i !== idx) };
    setSeriesEpisodes(updated.episodes!);
    setSelectedSeries(updated);
    onUpdateMovie(updated);
    showToast('Episode removed');
  };

  const handleUpdateOrderStatus = (order: ShopOrder, status: ShopOrder['status']) => {
    onUpdateOrder({ ...order, status });
    showToast(`Order #${order.id} -> ${statusLabel(status)}`);
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return o.id.toLowerCase().includes(q) || (o.shipping?.name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = { pending: 0, paid: 0, processing: 0, delivered: 0 };
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
    return [
      { name: 'Pending', count: map.pending, fill: '#FCD535' },
      { name: 'Paid', count: map.paid, fill: '#3B82F6' },
      { name: 'Processing', count: map.processing, fill: '#A855F7' },
      { name: 'Delivered', count: map.delivered, fill: '#0ECB81' }
    ];
  }, [orders]);

  const revenueByStatus = useMemo(() => {
    const map: Record<string, number> = { pending: 0, paid: 0, processing: 0, delivered: 0 };
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + o.total; });
    return [
      { name: 'Pending', value: Math.round(map.pending) },
      { name: 'Paid', value: Math.round(map.paid) },
      { name: 'Processing', value: Math.round(map.processing) },
      { name: 'Delivered', value: Math.round(map.delivered) }
    ];
  }, [orders]);

  const dailyOrders = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    orders.forEach(o => {
      const day = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[day]) map[day] = { count: 0, revenue: 0 };
      map[day].count++;
      map[day].revenue += o.total;
    });
    return Object.entries(map)
      .map(([date, data]) => ({ date, orders: data.count, revenue: Math.round(data.revenue) }))
      .slice(-14);
  }, [orders]);

  const paymentMethods = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const method = o.paymentMethod || 'unknown';
      map[method] = (map[method] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name === 'momo' ? 'MoMo' : name === 'airtel' ? 'Airtel' : name, value }));
  }, [orders]);

  const topMovies = useMemo(() => {
    const map: Record<number, { title: string; count: number; revenue: number }> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const movieId = parseInt(item.productId) || 0;
        if (!map[movieId]) map[movieId] = { title: item.name, count: 0, revenue: 0 };
        map[movieId].count += item.qty;
        map[movieId].revenue += item.price * item.qty;
      });
    });
    return Object.entries(map)
      .map(([id, data]) => ({ id: parseInt(id), ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [orders]);

  const allGenres = useMemo(() => {
    const map: Record<string, number> = {};
    movies.forEach(m => (m.genre || []).forEach(g => { map[g] = (map[g] || 0) + 1; }));
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [movies]);

  const ratingsData = useMemo(() => {
    const buckets = [
      { name: '1-2', min: 1, max: 2, count: 0 },
      { name: '2-3', min: 2, max: 3, count: 0 },
      { name: '3-4', min: 3, max: 4, count: 0 },
      { name: '4-5', min: 4, max: 5, count: 0 },
      { name: '5-6', min: 5, max: 6, count: 0 },
      { name: '6-7', min: 6, max: 7, count: 0 },
      { name: '7-8', min: 7, max: 8, count: 0 },
      { name: '8-9', min: 8, max: 9, count: 0 },
      { name: '9-10', min: 9, max: 10.1, count: 0 },
    ];
    movies.forEach(m => {
      const r = m.rating || 0;
      const b = buckets.find(b => r >= b.min && r < b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [movies]);

  const yearData = useMemo(() => {
    const map: Record<number, number> = {};
    movies.forEach(m => { if (m.year) map[m.year] = (map[m.year] || 0) + 1; });
    return Object.entries(map)
      .map(([year, count]) => ({ year: String(year), count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [movies]);

  const trackData = useMemo(() => {
    const agasobanuye = movies.filter(m => m.track === 'agasobanuye').length;
    const original = movies.filter(m => m.track !== 'agasobanuye').length;
    return [
      { name: 'Original', value: original },
      { name: 'Agasobanuye', value: agasobanuye }
    ];
  }, [movies]);

  const regionData = useMemo(() => {
    const map: Record<string, number> = {};
    movies.forEach(m => {
      const r = m.region || 'Unknown';
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [movies]);

  const priceRanges = useMemo(() => {
    const ranges = [
      { name: '$0-10', min: 0, max: 10, count: 0 },
      { name: '$10-20', min: 10, max: 20, count: 0 },
      { name: '$20-30', min: 20, max: 30, count: 0 },
      { name: '$30-50', min: 30, max: 50, count: 0 },
      { name: '$50+', min: 50, max: 9999, count: 0 },
    ];
    movies.forEach(m => {
      const p = m.price || 0;
      const r = ranges.find(r => p >= r.min && p < r.max);
      if (r) r.count++;
    });
    return ranges;
  }, [movies]);

  const movieStats = useMemo(() => {
    const total = movies.length;
    const trending = movies.filter(m => m.trending).length;
    const free = movies.filter(m => m.isFree).length;
    const avgRating = total > 0 ? movies.reduce((s, m) => s + (m.rating || 0), 0) / total : 0;
    const avgPrice = total > 0 ? movies.reduce((s, m) => s + (m.price || 0), 0) / total : 0;
    const genres = new Set(movies.flatMap(m => m.genre)).size;
    const regions = new Set(movies.map(m => m.region).filter(Boolean)).size;
    return { total, trending, free, avgRating, avgPrice, genres, regions };
  }, [movies]);

  const filteredMovies = useMemo(() => {
    let list = movies;
    if (movieSearch) {
      const q = movieSearch.toLowerCase();
      list = list.filter(m => m.title.toLowerCase().includes(q) || m.genre?.some(g => g.toLowerCase().includes(q)));
    }
    if (movieGenreFilter !== 'All') {
      list = list.filter(m => m.genre?.includes(movieGenreFilter));
    }
    if (movieTrackFilter !== 'all') {
      list = list.filter(m => (m.track || 'original') === movieTrackFilter);
    }
    return list;
  }, [movies, movieSearch, movieGenreFilter, movieTrackFilter]);

  const filteredComments = useMemo(() => {
    if (!commentSearch) return comments;
    const q = commentSearch.toLowerCase();
    return comments.filter(c => c.text.toLowerCase().includes(q) || c.userName.toLowerCase().includes(q));
  }, [comments, commentSearch]);

  const commentStats = useMemo(() => {
    const total = comments.length;
    const pinned = comments.filter(c => c.pinned).length;
    const topLevel = comments.filter(c => !c.parentId).length;
    const replies = total - topLevel;
    const uniqueUsers = new Set(comments.map(c => c.userId)).size;
    return { total, pinned, topLevel, replies, uniqueUsers };
  }, [comments]);

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'movies', label: 'Movies', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
    { id: 'reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'customers', label: 'Customers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'support', label: 'Support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' }
  ];

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-bBlack flex animate-fade-in font-sans text-bText">
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded shadow-xl z-[100] animate-slide-up flex items-center gap-3 ${notification.type === 'success' ? 'bg-bGreen text-black' : 'bg-bRed text-white'}`}>
          <span className="font-bold">{notification.type === 'success' ? '\u2713' : '\u26A0'}</span>
          {notification.message}
        </div>
      )}

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
          {tabs.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3.5 border-l-4 transition-all hover:bg-bGray/10 ${activeTab === item.id ? 'border-bYellow text-bYellow bg-bGray/10' : 'border-transparent text-bTextSecondary hover:text-white'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
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
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>

            <div className="relative hidden md:flex items-center bg-bBlack/60 border border-bGray/60 rounded-lg px-3 py-1.5 hover:border-bTextSecondary/40 transition-colors w-64">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-bTextSecondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-bTextSecondary ml-2 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-bGray/20 text-bTextSecondary hover:text-white transition-all" title="Notifications">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {pendingOrders > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-bRed text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingOrders}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-bGray/40" />

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
              onClick={onLogout}
              className="group bg-bGray/20 hover:bg-bRed/20 text-bTextSecondary hover:text-bRed px-3 py-2 rounded-lg flex items-center gap-2 transition-all border border-transparent hover:border-bRed/30"
            >
              <span className="text-xs font-medium hidden sm:inline">Exit</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-bBlack p-8">

          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', val: formatFrw(totalRevenue), change: `${deliveredOrders} completed`, color: 'bGreen' },
                  { label: 'Total Orders', val: totalOrders, change: `${pendingOrders} pending`, color: pendingOrders > 0 ? 'bYellow' : 'bGreen' },
                  { label: 'Total Movies', val: movieStats.total, change: `${movieStats.trending} trending`, color: 'bGreen' },
                  { label: 'Total Users', val: users.length, change: `${users.filter(u => u.isVip).length} VIP`, color: 'bGreen' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-bDark p-6 rounded-lg border border-bGray hover:border-bTextSecondary/50 transition-colors">
                    <div className="text-bTextSecondary text-xs uppercase font-bold tracking-wider mb-2">{stat.label}</div>
                    <div className="text-3xl font-bold text-white mb-2">{stat.val}</div>
                    <div className={`text-xs font-bold ${stat.color === 'bRed' ? 'text-bRed' : stat.color === 'bYellow' ? 'text-bYellow' : 'text-bGreen'}`}>{stat.change}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Avg Rating', val: movieStats.avgRating.toFixed(1), icon: '\u2B50' },
                  { label: 'Genres', val: movieStats.genres, icon: '\uD83C\uDFAD' },
                  { label: 'Free Movies', val: movieStats.free, icon: '\uD83C\uDF89' },
                  { label: 'Avg Price', val: formatFrw(movieStats.avgPrice), icon: '\uD83D\uDCB0' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-bDark p-5 rounded-lg border border-bGray hover:border-bYellow/40 transition-colors flex items-center gap-4">
                    <div className="text-3xl">{stat.icon}</div>
                    <div>
                      <div className="text-bTextSecondary text-xs uppercase font-bold tracking-wider">{stat.label}</div>
                      <div className="text-2xl font-bold text-white">{stat.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Order Status</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {ordersByStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Revenue by Status</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueByStatus} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                      <XAxis dataKey="name" tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <YAxis tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]}>
                        {revenueByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Daily Orders & Revenue</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyOrders} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                      <XAxis dataKey="date" tick={{ fill: '#848E9C', fontSize: 10 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="orders" name="Orders" stroke="#FCD535" fill="#FCD535" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0ECB81" fill="#0ECB81" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Payment Methods</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={paymentMethods} cx="50%" cy="50%" outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {paymentMethods.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Genre Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={allGenres.slice(0, 10)} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                      <XAxis dataKey="name" tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <YAxis tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Movies" radius={[4, 4, 0, 0]}>
                        {allGenres.slice(0, 10).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Rating Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ratingsData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                      <XAxis dataKey="name" tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <YAxis tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Movies" stroke="#FCD535" fill="#FCD535" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Movies by Year</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yearData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                      <XAxis dataKey="year" tick={{ fill: '#848E9C', fontSize: 10 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Movies" fill="#0ECB81" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Track Split</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={trackData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {trackData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Region Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={regionData}>
                      <PolarGrid stroke="#2B3139" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: '#848E9C', fontSize: 10 }} />
                      <PolarRadiusAxis tick={{ fill: '#848E9C', fontSize: 10 }} />
                      <Radar name="Movies" dataKey="count" stroke="#FCD535" fill="#FCD535" fillOpacity={0.2} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Price Ranges</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priceRanges} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                      <XAxis dataKey="name" tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <YAxis tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Movies" radius={[4, 4, 0, 0]}>
                        {priceRanges.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {topMovies.length > 0 && (
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Top Selling Content</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-xs uppercase text-bTextSecondary font-bold border-b border-bGray">
                        <tr>
                          <th className="pb-3 pr-4">#</th>
                          <th className="pb-3 pr-4">Title</th>
                          <th className="pb-3 pr-4">Units Sold</th>
                          <th className="pb-3">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-bGray/10">
                        {topMovies.map((m, i) => (
                          <tr key={m.id} className="hover:bg-bGray/10 transition-colors">
                            <td className="py-3 pr-4 text-bTextSecondary text-sm">{i + 1}</td>
                            <td className="py-3 pr-4 text-sm text-white font-medium">{m.title}</td>
                            <td className="py-3 pr-4 text-sm text-bText">{m.count}</td>
                            <td className="py-3 text-sm font-bold text-bYellow">{formatFrw(m.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Recent Orders</h3>
                <div className="bg-bDark border border-bGray rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-bGray/20 text-xs uppercase text-bTextSecondary font-bold border-b border-bGray">
                      <tr>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Items</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bGray/10">
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id} className="hover:bg-bGray/10 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-bYellow">#{order.id}</td>
                          <td className="px-6 py-4 text-sm text-white">{order.shipping?.name || 'Guest'}</td>
                          <td className="px-6 py-4 text-sm text-white">{order.items.map(i => i.name).join(', ')}</td>
                          <td className="px-6 py-4 text-sm font-bold text-white">{formatFrw(order.total)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.status === 'delivered' ? 'bg-bGreen/20 text-bGreen' : order.status === 'pending' ? 'bg-bYellow/20 text-bYellow' : 'bg-bGray/30 text-bText'}`}>
                              {statusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-bTextSecondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Orders</h2>
                <div className="flex gap-2">
                  {['all', 'pending', 'paid', 'processing', 'delivered'].map(f => (
                    <button key={f} onClick={() => setOrderFilter(f)} className={`px-3 py-1 rounded text-xs font-bold ${orderFilter === f ? 'bg-bYellow text-black' : 'bg-bGray/30 text-bText hover:bg-bGray'}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-bDark border border-bGray rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-bGray/20 text-xs uppercase text-bTextSecondary font-bold border-b border-bGray">
                    <tr>
                      <th className="px-6 py-4">Order</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Items</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Payment</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bGray/10">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-bGray/10 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-bYellow">#{order.id}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">{order.shipping?.name || 'Guest'}</div>
                          <div className="text-[10px] text-bTextSecondary">{order.shipping?.phone || ''}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{order.items.map(i => `${i.name} x${i.qty}`).join(', ')}</td>
                        <td className="px-6 py-4 text-sm font-bold text-white">{formatFrw(order.total)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-bGray/30 text-bText">
                            {order.paymentMethod === 'momo' ? 'MoMo' : order.paymentMethod === 'airtel' ? 'Airtel' : order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.status === 'delivered' ? 'bg-bGreen/20 text-bGreen' : order.status === 'pending' ? 'bg-bYellow/20 text-bYellow' : order.status === 'paid' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order, e.target.value as ShopOrder['status'])}
                            className="bg-bBlack border border-bGray rounded px-2 py-1 text-xs text-white"
                          >
                            {['pending', 'paid', 'processing', 'delivered'].map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-bTextSecondary text-sm">No orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'movies' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Movies</h2>
                <button onClick={() => navigate('/admin/add-movie')} className="bg-bYellow text-black px-4 py-2 rounded font-bold hover:bg-bYellowHover flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Movie
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Movies', val: movieStats.total, color: 'text-white' },
                  { label: 'Avg Rating', val: movieStats.avgRating.toFixed(1), color: 'text-bYellow' },
                  { label: 'Free Movies', val: movieStats.free, color: 'text-bGreen' },
                  { label: 'Avg Price', val: formatFrw(movieStats.avgPrice), color: 'text-bYellow' }
                ].map((s, i) => (
                  <div key={i} className="bg-bDark border border-bGray rounded-lg p-4">
                    <div className="text-bTextSecondary text-xs uppercase font-bold tracking-wider mb-1">{s.label}</div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-bTextSecondary absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Search movies..." value={movieSearch} onChange={(e) => setMovieSearch(e.target.value)} className="w-full bg-bDark border border-bGray rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                </div>
                <select value={movieGenreFilter} onChange={(e) => setMovieGenreFilter(e.target.value)} className="bg-bDark border border-bGray rounded-lg px-3 py-2 text-sm text-white">
                  <option value="All">All Genres</option>
                  {allGenres.map(g => <option key={g.name} value={g.name}>{g.name} ({g.count})</option>)}
                </select>
                <select value={movieTrackFilter} onChange={(e) => setMovieTrackFilter(e.target.value as any)} className="bg-bDark border border-bGray rounded-lg px-3 py-2 text-sm text-white">
                  <option value="all">All Tracks</option>
                  <option value="agasobanuye">Agasobanuye</option>
                  <option value="original">Original</option>
                </select>
                <div className="flex bg-bDark border border-bGray rounded-lg overflow-hidden">
                  <button onClick={() => setMovieViewMode('grid')} className={`px-3 py-2 text-sm font-bold transition-colors ${movieViewMode === 'grid' ? 'bg-bYellow text-black' : 'text-bTextSecondary hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button onClick={() => setMovieViewMode('table')} className={`px-3 py-2 text-sm font-bold transition-colors ${movieViewMode === 'table' ? 'bg-bYellow text-black' : 'text-bTextSecondary hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
                <span className="text-xs text-bTextSecondary ml-2">{filteredMovies.length} movies</span>
              </div>

              {selectedSeries ? (
                <div className="animate-fade-in space-y-6">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedSeries(null)} className="text-bTextSecondary hover:text-white flex items-center gap-1 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Back to Movies
                    </button>
                  </div>

                  <div className="bg-bDark border border-bGray rounded-lg p-6">
                    <div className="flex items-start gap-6">
                      <img src={selectedSeries.imageUrl || selectedSeries.backdropUrl} alt={selectedSeries.title} className="w-32 h-48 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-xl font-bold text-white">{selectedSeries.title}</h2>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bYellow/20 text-bYellow uppercase">Series</span>
                        </div>
                        <p className="text-sm text-bTextSecondary mb-3">{selectedSeries.description || selectedSeries.overview || 'No description'}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-bTextSecondary">
                          <span>{selectedSeries.year}</span>
                          <span>★ {selectedSeries.rating?.toFixed(1) || 'N/A'}</span>
                          <span>{(selectedSeries.genre || []).join(', ')}</span>
                          <span>{selectedSeries.region}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-bDark border border-bGray rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-bTextSecondary uppercase tracking-wider">Episodes ({seriesEpisodes.length})</h3>
                    </div>

                    {seriesEpisodes.length > 0 && (
                      <div className="space-y-2 mb-6">
                        {seriesEpisodes.map((ep, idx) => (
                          <div key={ep.id || idx} className="flex items-center gap-3 bg-bBlack border border-bGray/50 rounded-lg px-4 py-3">
                            <div className="w-8 h-8 rounded-full bg-bGreen/20 flex items-center justify-center text-xs font-bold text-bGreen shrink-0">✓</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white font-medium truncate">{ep.title}</div>
                              <div className="text-xs text-bTextSecondary">S{ep.season || 1}E{idx + 1} · {ep.url ? 'Video uploaded' : 'No video'}</div>
                            </div>
                            <button onClick={() => handleRemoveEpisode(idx)} className="text-bTextSecondary hover:text-bRed text-xs shrink-0">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-bBlack border border-dashed border-bGray rounded-lg p-4 space-y-3">
                      <div className="text-xs font-bold text-bTextSecondary uppercase">Add New Episode</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input type="text" value={newEpisode.title} onChange={e => setNewEpisode(p => ({ ...p, title: e.target.value }))}
                          placeholder={`Episode ${newEpisode.episode} title`}
                          className="bg-bDark border border-bGray rounded px-3 py-2 text-sm text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
                        <input type="number" min="1" value={newEpisode.season} onChange={e => setNewEpisode(p => ({ ...p, season: parseInt(e.target.value) || 1 }))}
                          className="bg-bDark border border-bGray rounded px-3 py-2 text-sm text-white focus:border-bYellow/50 focus:outline-none" title="Season" />
                        <input type="number" min="1" value={newEpisode.episode} onChange={e => setNewEpisode(p => ({ ...p, episode: parseInt(e.target.value) || 1 }))}
                          className="bg-bDark border border-bGray rounded px-3 py-2 text-sm text-white focus:border-bYellow/50 focus:outline-none" title="Episode" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input ref={episodeFileInputRef} type="file" accept="video/*"
                          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleEpisodeUpload(f); e.target.value = ''; }} />
                        <button type="button" onClick={() => episodeFileInputRef.current?.click()} disabled={episodeUploading}
                          className="flex items-center gap-2 border border-dashed border-bGray hover:border-bYellow/50 rounded px-3 py-2 text-xs text-bTextSecondary hover:text-bYellow transition-colors disabled:opacity-50">
                          {episodeUploading ? (
                            <><span className="animate-spin">⏳</span> Uploading...</>
                          ) : (
                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> Upload video</>
                          )}
                        </button>
                        {newEpisode.videoUrl && <span className="text-xs text-bGreen">✓ Video ready</span>}
                      </div>
                      <button onClick={handleAddEpisode} disabled={!onUpdateMovie}
                        className="bg-bYellow text-black px-4 py-2 rounded text-sm font-bold hover:bg-bYellowHover disabled:opacity-50 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        Add Episode
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {movieViewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredMovies.map(movie => (
                    <div key={movie.id} className="bg-bDark border border-bGray rounded-lg overflow-hidden hover:border-bYellow/50 transition-all cursor-pointer group" onClick={() => movie.type === 'series' || movie.episodes?.length ? openSeries(movie) : navigate(`/movie/${movie.id}`)}>
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img src={movie.imageUrl || movie.backdropUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="text-xs font-bold text-white truncate">{movie.title}</div>
                        </div>
                        {movie.trending && <div className="absolute top-2 left-2 bg-bRed px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase">Trending</div>}
                        {movie.track === 'agasobanuye' && <div className="absolute top-2 right-2 bg-bYellow px-2 py-0.5 rounded text-[10px] font-bold text-black">Agasobanuye</div>}
                      </div>
                      <div className="p-3">
                        <div className="text-xs text-bTextSecondary truncate mb-2">{(movie.genre || []).slice(0, 2).join(', ')}</div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-bYellow" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs text-bYellow font-bold">{movie.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <span className="text-xs text-bTextSecondary">{movie.year}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold text-bGreen">{formatFrw(movie.price)}</span>
                          <span className="text-[10px] text-bTextSecondary">{movie.duration || ''}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-bDark border border-bGray rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-bGray/20 text-xs uppercase text-bTextSecondary font-bold border-b border-bGray">
                      <tr>
                        <th className="px-6 py-4">Movie</th>
                        <th className="px-6 py-4">Genres</th>
                        <th className="px-6 py-4">Track</th>
                        <th className="px-6 py-4">Region</th>
                        <th className="px-6 py-4">Year</th>
                        <th className="px-6 py-4">Rating</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bGray/10">
                      {filteredMovies.map(movie => (
                        <tr key={movie.id} className="hover:bg-bGray/10 transition-colors cursor-pointer" onClick={() => movie.type === 'series' || movie.episodes?.length ? openSeries(movie) : navigate(`/movie/${movie.id}`)}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={movie.imageUrl || movie.backdropUrl} alt="" className="w-8 h-12 rounded object-cover" />
                              <div>
                                <div className="text-sm text-white font-medium truncate max-w-[200px]">{movie.title}</div>
                                {movie.trending && <span className="text-[10px] text-bRed font-bold uppercase">Trending</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-bText">{(movie.genre || []).slice(0, 2).join(', ')}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${movie.track === 'agasobanuye' ? 'bg-bYellow/20 text-bYellow' : 'bg-bGreen/20 text-bGreen'}`}>
                              {movie.track === 'agasobanuye' ? 'Agasobanuye' : 'Original'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-bTextSecondary">{movie.region || '\u2014'}</td>
                          <td className="px-6 py-4 text-sm text-bTextSecondary">{movie.year || '\u2014'}</td>
                          <td className="px-6 py-4 text-sm text-bYellow">{movie.rating?.toFixed(1) || '\u2014'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-bGreen">{formatFrw(movie.price)}</td>
                          <td className="px-6 py-4 text-sm text-bTextSecondary">{movie.duration || '\u2014'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
                </>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Reports</h2>
                <div className="flex gap-2">
                  {(['all', '7d', '30d', '90d'] as const).map(p => (
                    <button key={p} onClick={() => setReportPeriod(p)} className={`px-3 py-1 rounded text-xs font-bold ${reportPeriod === p ? 'bg-bYellow text-black' : 'bg-bGray/30 text-bText hover:bg-bGray'}`}>
                      {p === 'all' ? 'All Time' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h4 className="text-bTextSecondary text-xs uppercase font-bold mb-2">Total Revenue</h4>
                  <p className="text-3xl font-bold text-bYellow">{formatFrw(totalRevenue)}</p>
                  <p className="text-xs text-bGreen mt-1">{formatFrw(totalOrders > 0 ? totalRevenue / totalOrders : 0)} avg/order</p>
                </div>
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h4 className="text-bTextSecondary text-xs uppercase font-bold mb-2">Total Orders</h4>
                  <p className="text-3xl font-bold text-white">{totalOrders}</p>
                  <p className="text-xs text-bTextSecondary mt-1">{pendingOrders} pending, {deliveredOrders} delivered</p>
                </div>
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h4 className="text-bTextSecondary text-xs uppercase font-bold mb-2">Total Movies</h4>
                  <p className="text-3xl font-bold text-white">{movieStats.total}</p>
                  <p className="text-xs text-bTextSecondary mt-1">{movieStats.genres} genres, {movieStats.regions} regions</p>
                </div>
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h4 className="text-bTextSecondary text-xs uppercase font-bold mb-2">Total Users</h4>
                  <p className="text-3xl font-bold text-white">{users.length}</p>
                  <p className="text-xs text-bTextSecondary mt-1">{users.filter(u => u.isVip).length} VIP members</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Revenue by Status</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueByStatus} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                      <XAxis dataKey="name" tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <YAxis tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]}>
                        {revenueByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Order Volume</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={ordersByStatus} cx="50%" cy="50%" outerRadius={100} paddingAngle={4} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {ordersByStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-bDark border border-bGray rounded-lg p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Daily Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyOrders} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                    <XAxis dataKey="date" tick={{ fill: '#848E9C', fontSize: 10 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#848E9C', fontSize: 11 }} axisLine={{ stroke: '#2B3139' }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="orders" name="Orders" stroke="#FCD535" fill="#FCD535" fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0ECB81" fill="#0ECB81" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {topMovies.length > 0 && (
                <div className="bg-bDark border border-bGray rounded-lg p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Top Revenue Content</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-xs uppercase text-bTextSecondary font-bold border-b border-bGray">
                        <tr>
                          <th className="pb-3 pr-4">#</th>
                          <th className="pb-3 pr-4">Title</th>
                          <th className="pb-3 pr-4">Units Sold</th>
                          <th className="pb-3">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-bGray/10">
                        {topMovies.map((m, i) => (
                          <tr key={m.id} className="hover:bg-bGray/10 transition-colors">
                            <td className="py-3 pr-4 text-bTextSecondary text-sm">{i + 1}</td>
                            <td className="py-3 pr-4 text-sm text-white font-medium">{m.title}</td>
                            <td className="py-3 pr-4 text-sm text-bText">{m.count}</td>
                            <td className="py-3 text-sm font-bold text-bYellow">{formatFrw(m.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Customers</h2>
                <span className="text-sm text-bTextSecondary">{users.length} total users</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-bDark border border-bGray rounded-lg p-4">
                  <div className="text-bTextSecondary text-xs uppercase font-bold mb-1">Total Users</div>
                  <div className="text-2xl font-bold text-white">{users.length}</div>
                </div>
                <div className="bg-bDark border border-bGray rounded-lg p-4">
                  <div className="text-bTextSecondary text-xs uppercase font-bold mb-1">VIP Members</div>
                  <div className="text-2xl font-bold text-bYellow">{users.filter(u => u.isVip).length}</div>
                </div>
                <div className="bg-bDark border border-bGray rounded-lg p-4">
                  <div className="text-bTextSecondary text-xs uppercase font-bold mb-1">Admins</div>
                  <div className="text-2xl font-bold text-bRed">{users.filter(u => u.isAdmin).length}</div>
                </div>
              </div>

              <div className="bg-bDark border border-bGray rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-bGray/20 text-xs uppercase text-bTextSecondary font-bold border-b border-bGray">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bGray/10">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-bGray/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ${u.isAdmin ? 'bg-bRed/20 border border-bRed/40 text-bRed' : u.isVip ? 'bg-bYellow/20 border border-bYellow/40 text-bYellow' : 'bg-bGray/30 border border-bGray/60 text-bText'}`}>
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm text-white font-medium">{u.name}</div>
                              <div className="text-[10px] text-bTextSecondary">ID: {u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-bTextSecondary">{u.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {u.isAdmin && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bRed/20 text-bRed">Admin</span>}
                            {u.isVip && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bYellow/20 text-bYellow">VIP</span>}
                            {!u.isAdmin && !u.isVip && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bGray/30 text-bTextSecondary">Free</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-xs text-bGreen">
                            <span className="h-1.5 w-1.5 rounded-full bg-bGreen inline-block" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-bTextSecondary text-sm">No customers found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Support / Comments</h2>
                <span className="text-sm text-bTextSecondary">{comments.length} total comments</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-bDark border border-bGray rounded-lg p-4">
                  <div className="text-bTextSecondary text-xs uppercase font-bold mb-1">Total Comments</div>
                  <div className="text-2xl font-bold text-white">{commentStats.total}</div>
                </div>
                <div className="bg-bDark border border-bGray rounded-lg p-4">
                  <div className="text-bTextSecondary text-xs uppercase font-bold mb-1">Top-Level</div>
                  <div className="text-2xl font-bold text-bYellow">{commentStats.topLevel}</div>
                </div>
                <div className="bg-bDark border border-bGray rounded-lg p-4">
                  <div className="text-bTextSecondary text-xs uppercase font-bold mb-1">Replies</div>
                  <div className="text-2xl font-bold text-bGreen">{commentStats.replies}</div>
                </div>
                <div className="bg-bDark border border-bGray rounded-lg p-4">
                  <div className="text-bTextSecondary text-xs uppercase font-bold mb-1">Pinned</div>
                  <div className="text-2xl font-bold text-purple-400">{commentStats.pinned}</div>
                </div>
              </div>

              <div className="relative mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-bTextSecondary absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Search comments..." value={commentSearch} onChange={(e) => setCommentSearch(e.target.value)} className="w-full bg-bDark border border-bGray rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-bTextSecondary focus:border-bYellow/50 focus:outline-none" />
              </div>

              <div className="bg-bDark border border-bGray rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-bGray/20 text-xs uppercase text-bTextSecondary font-bold border-b border-bGray">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Comment</th>
                      <th className="px-6 py-4">Movie ID</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Likes</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bGray/10">
                    {filteredComments.map(comment => (
                      <tr key={comment.id} className="hover:bg-bGray/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${comment.isAdmin ? 'bg-bRed/20 border border-bRed/40 text-bRed' : comment.userIsVip ? 'bg-bYellow/20 border border-bYellow/40 text-bYellow' : 'bg-bGray/30 border border-bGray/60 text-bText'}`}>
                              {comment.userName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm text-white font-medium">{comment.userName}</div>
                              <div className="text-[10px] text-bTextSecondary">{comment.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-bText max-w-xs">
                          <div className="truncate">{comment.text}</div>
                        </td>
                        <td className="px-6 py-4">
                          {comment.movieId ? (
                            <button onClick={() => navigate(`/movie/${comment.movieId}`)} className="text-xs text-bYellow hover:underline">
                              #{comment.movieId}
                            </button>
                          ) : (
                            <span className="text-xs text-bTextSecondary">\u2014</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {comment.pinned && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">Pinned</span>}
                            {comment.parentId && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bGray/30 text-bTextSecondary">Reply</span>}
                            {!comment.parentId && !comment.pinned && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bGreen/20 text-bGreen">Top-level</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-bText">{comment.likedBy?.length || 0}</td>
                        <td className="px-6 py-4 text-xs text-bTextSecondary">{new Date(comment.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {filteredComments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-bTextSecondary text-sm">
                          {comments.length === 0 ? 'No comments yet.' : 'No comments match your search.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopAdminPage;
