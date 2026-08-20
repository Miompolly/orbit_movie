
import React, { useState, useEffect, useRef } from 'react';
import { Movie, User, Comment } from '../types';

interface PlayViewProps {
  movie: Movie;
  onClose: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onOpenSub: () => void;
}

interface Episode {
  id: number;
  title: string;
  duration: string;
  views: string;
  rating: number; // For red/green indicators
  category: string;
  season: number;
  isLocked: boolean;
}

type Tab = 'markets' | 'trollbox';

const FILTERS = ['All', 'Season 1', 'Season 2', 'Action', 'Romantic', 'Drama', 'Indundi', 'Inyarwanda', 'Tanzanie', 'Ingande', 'Izisobanuye', 'Songs'];
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITIES = ['1080p HD', '720p', '480p', '360p', 'Auto'];

const PlayView: React.FC<PlayViewProps> = ({ movie, onClose, user, onOpenAuth, onOpenSub }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  
  // Settings & Menus
  const [showSettings, setShowSettings] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false); // Three dots menu
  const [showSpeedMenu, setShowSpeedMenu] = useState(false); // Speed sub-menu
  
  // Player State
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('1080p HD');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Dragging State for PiP
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [activeTab, setActiveTab] = useState<Tab>('markets');
  const [activeFilter, setActiveFilter] = useState('All');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Comment State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Sync React state with Video Element
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.log("Playback prevented:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle Playback Speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Dragging Logic
  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling on touch

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      setPosition({
        x: clientX - dragStartRef.current.x,
        y: clientY - dragStartRef.current.y
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMinimized) return;
    // Only drag if clicking the container, not buttons inside
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    // Initialize position to bottom right with margin
    const initialWidth = 360;
    const initialHeight = 200; 
    setPosition({
      x: window.innerWidth - initialWidth - 20,
      y: window.innerHeight - initialHeight - 20
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // Generate related "Episodes" with Categories
  useEffect(() => {
    const categories = ['Action', 'Romantic', 'Drama', 'Indundi', 'Inyarwanda', 'Tanzanie', 'Ingande', 'Izisobanuye', 'Music'];

    const mockEpisodes = Array.from({ length: 30 }).map((_, i) => {
      const season = Math.random() > 0.5 ? 2 : 1;
      const category = categories[Math.floor(Math.random() * categories.length)];

      return {
        id: i + 1,
        title: `${category} Clip ${i + 1}: ${movie.title}`,
        duration: `${10 + (i * 2)}m`,
        views: `${(Math.random() * 10).toFixed(2)}M`,
        rating: Math.random() > 0.5 ? 1 : -1,
        category: category,
        season: season,
        isLocked: false
      };
    });
    setEpisodes(mockEpisodes);
  }, [movie, user]);

  // Initial Mock Comments
  useEffect(() => {
    const mockComments: Comment[] = [
      { id: '1', userId: '101', userName: 'CryptoKing', userIsVip: true, text: 'This plot twist is bullish! 🚀', timestamp: '10:02' },
      { id: '2', userId: '102', userName: 'HodlGang', userIsVip: false, text: 'Lighting is a bit dark, but story is good.', timestamp: '10:05' },
      { id: '3', userId: '103', userName: 'MoonWalker', userIsVip: true, text: 'Waiting for the sequel dump.', timestamp: '10:08' },
    ];
    setComments(mockComments);
  }, [movie]);

  useEffect(() => {
    if (activeTab === 'trollbox' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab]);

  // Reset pagination when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userIsVip: user.isVip,
      text: newComment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  // Filter Logic
  const filteredEpisodes = episodes.filter(ep => {
    let matchesFilter = true;
    if (activeFilter !== 'All') {
      if (activeFilter.startsWith('Season')) {
        const seasonNum = parseInt(activeFilter.split(' ')[1]);
        matchesFilter = ep.season === seasonNum;
      } else if (activeFilter === 'Songs') {
        matchesFilter = ep.category === 'Music';
      } else {
        matchesFilter = ep.category === activeFilter;
      }
    }

    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      ep.title.toLowerCase().includes(query) || 
      ep.category.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredEpisodes.length / itemsPerPage);
  const currentEpisodes = filteredEpisodes.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      style={isMinimized ? { 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: '360px',
        height: 'auto',
        borderRadius: '8px',
        cursor: isDragging ? 'grabbing' : 'grab'
      } : {}}
      className={`
        bg-bBlack flex flex-col
        ${isMinimized 
          ? 'fixed z-[100] shadow-2xl border border-bGray overflow-hidden' 
          : 'fixed inset-0 z-[100]'}
        ${!isDragging ? 'transition-all duration-300' : 'transition-none'} 
        animate-fade-in
      `}
    >
      {/* Header - Hidden when minimized */}
      {!isMinimized && (
        <div className="h-16 border-b border-bGray bg-bDark flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="text-bTextSecondary hover:text-bYellow transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white leading-tight">{movie.title}</h1>
              <span className="text-xs text-bTextSecondary">Movie / HD Free • {movie.genre[0]}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-bTextSecondary">
             <span>Server: <span className="text-bGreen font-medium">Binance US-East</span></span>
             <div className="h-4 w-px bg-bGray"></div>
             <span>Ping: <span className="text-bGreen font-medium">12ms</span></span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Video Player */}
        <div 
           ref={videoContainerRef}
           className={`flex flex-col transition-all duration-300 bg-black ${isMinimized ? 'w-full h-full' : (isExpanded ? 'w-full' : 'w-full md:w-3/4')}`}
        >
          <div className="relative flex-1 bg-black group flex items-center justify-center overflow-hidden">
            
            <video
              ref={videoRef}
              src={movie.trailerUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
              className="w-full h-full object-contain"
              poster={movie.backdropUrl}
              playsInline
              loop
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onClick={() => {
                if (isMinimized) {
                    setIsMinimized(false);
                } else {
                    setIsPlaying(!isPlaying);
                    setShowSettings(false);
                    setShowMoreMenu(false);
                }
              }}
            />
            
            {/* Minimal Controls Overlay (When Minimized) */}
            {isMinimized && (
                <div className="absolute top-2 right-2 flex gap-2 z-30">
                     <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(false);
                        }}
                        className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white hover:text-bYellow transition-colors"
                        title="Expand"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white hover:text-bRed transition-colors"
                        title="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Play/Pause Center Overlay */}
            {!isMinimized && !isPlaying && (
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="absolute z-10 w-20 h-20 bg-bYellow/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(252,213,53,0.4)]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            {/* Controls Bar - Hidden when minimized */}
            {!isMinimized && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex items-center px-4 md:px-6 gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  
                  {/* Prev Button */}
                  <button onClick={() => skipTime(-10)} className="text-white hover:text-bYellow transition-colors" title="Rewind 10s">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                     </svg>
                  </button>

                  {/* Play/Pause */}
                  <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-bYellow">
                    {isPlaying ? (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                       </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Next Button */}
                  <button onClick={() => skipTime(10)} className="text-white hover:text-bYellow transition-colors" title="Skip 10s">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                    </svg>
                  </button>
                  
                  {/* Progress Bar */}
                  <div className="flex-1 h-1 bg-bGray/50 rounded-full cursor-pointer relative group/progress">
                    <div 
                        className="h-full bg-bYellow rounded-full relative" 
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow"></div>
                    </div>
                  </div>

                  <div className="text-xs text-white font-mono whitespace-nowrap">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-2 w-20 hidden md:flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume} 
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="w-full h-1 bg-bGray rounded-lg appearance-none cursor-pointer accent-bYellow" 
                    />
                  </div>

                  {/* Settings (Quality) */}
                  <div className="relative">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(!showSettings);
                            setShowMoreMenu(false);
                        }} 
                        className={`text-white hover:text-bYellow transition-colors ${showSettings ? 'text-bYellow' : ''}`}
                        title="Quality Settings"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    {showSettings && (
                      <div className="absolute bottom-12 right-[-20px] bg-bDark border border-bGray rounded shadow-xl p-2 w-48 animate-fade-in z-40">
                        <div className="text-xs text-bTextSecondary uppercase mb-2 px-2 font-bold">Quality</div>
                        <div className="space-y-1">
                          {QUALITIES.map((q) => (
                             <button 
                               key={q}
                               onClick={() => {
                                 setSelectedQuality(q);
                                 setShowSettings(false);
                               }}
                               className="w-full text-left px-2 py-2 hover:bg-bGray rounded text-sm text-bText flex justify-between group items-center"
                             >
                               <span>{q}</span>
                               <div className="flex items-center gap-2">
                                   {selectedQuality === q && <span className="text-bYellow">✓</span>}
                               </div>
                             </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Three Dots Menu (More) */}
                  <div className="relative">
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMoreMenu(!showMoreMenu);
                            setShowSettings(false);
                            setShowSpeedMenu(false);
                        }}
                        className={`text-white hover:text-bYellow transition-colors ${showMoreMenu ? 'text-bYellow' : ''}`}
                        title="More Options"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                         </svg>
                      </button>

                      {showMoreMenu && (
                        <div className="absolute bottom-12 right-0 bg-bDark border border-bGray rounded shadow-xl w-56 animate-fade-in z-40 overflow-hidden">
                            {!showSpeedMenu ? (
                                <>
                                    {/* Picture in Picture */}
                                    <button 
                                        onClick={() => {
                                            handleMinimize();
                                            setShowMoreMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-bGray text-sm text-white flex items-center gap-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bTextSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Picture in Picture
                                    </button>
                                    
                                    {/* Playback Speed Trigger */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSpeedMenu(true);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-bGray text-sm text-white flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bTextSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Playback Speed
                                        </div>
                                        <span className="text-xs text-bTextSecondary flex items-center gap-1">
                                            {playbackSpeed}x 
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Back from Speed Menu */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSpeedMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-3 bg-bGray/20 text-sm text-white flex items-center gap-2 border-b border-bGray/50"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                           <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Back to Options
                                    </button>
                                    <div className="max-h-48 overflow-y-auto">
                                        {SPEEDS.map(speed => (
                                            <button
                                                key={speed}
                                                onClick={() => {
                                                    setPlaybackSpeed(speed);
                                                    setShowSpeedMenu(false);
                                                    setShowMoreMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-bGray text-sm text-white flex justify-between"
                                            >
                                                <span>{speed}x</span>
                                                {playbackSpeed === speed && <span className="text-bYellow">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                      )}
                  </div>
                  
                  {/* Fullscreen Toggle */}
                  <button onClick={toggleFullscreen} className="text-white hover:text-bYellow transition-colors" title="Full Screen">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4" />
                    </svg>
                  </button>

                  {/* Expand Toggle */}
                  <button onClick={() => setIsExpanded(!isExpanded)} className="text-white hover:text-bYellow transition-colors hidden md:block">
                    {isExpanded ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    )}
                  </button>
                </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Hidden if Minimized */}
        {!isMinimized && !isExpanded && (
          <div className="w-1/4 bg-bDark border-l border-bGray flex flex-col hidden md:flex">
            {/* Tabs */}
            <div className="flex border-b border-bGray">
              <button 
                onClick={() => setActiveTab('markets')}
                className={`flex-1 py-3 text-sm font-bold ${activeTab === 'markets' ? 'text-bYellow border-b-2 border-bYellow bg-bGray/20' : 'text-bTextSecondary hover:text-bText hover:bg-bGray/10'}`}
              >
                Markets
              </button>
              <button 
                onClick={() => setActiveTab('trollbox')}
                className={`flex-1 py-3 text-sm font-bold ${activeTab === 'trollbox' ? 'text-bYellow border-b-2 border-bYellow bg-bGray/20' : 'text-bTextSecondary hover:text-bText hover:bg-bGray/10'}`}
              >
                Trollbox
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
              
              {/* Episodes List with Filter Bar */}
              {activeTab === 'markets' && (
                <>
                  {/* Search Bar */}
                  <div className="p-3 bg-bDark border-b border-bGray/30 sticky top-0 z-10">
                    <div className="relative">
                       <input 
                         type="text" 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         placeholder="Search episodes..."
                         className="w-full bg-bBlack border border-bGray rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-bYellow transition-colors pl-8"
                       />
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-bTextSecondary absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                       </svg>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div className="px-2 py-2 bg-bGray/10 border-b border-bGray/30 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2">
                    {FILTERS.map(filter => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                          activeFilter === filter 
                          ? 'bg-bYellow/20 text-bYellow border-bYellow' 
                          : 'bg-transparent text-bTextSecondary border-bGray hover:text-white hover:border-bTextSecondary'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs text-bTextSecondary px-3 py-2 bg-bGray/10">
                    <span>Part / Title</span>
                    <span>Views / Trend</span>
                  </div>
                  
                  {/* Paginated List */}
                  {currentEpisodes.length > 0 ? (
                    currentEpisodes.map((ep, idx) => (
                      <div 
                        key={ep.id} 
                        className={`group flex items-center justify-between p-2 px-3 border-b border-bGray/30 hover:bg-bGray/50 cursor-pointer transition-colors ${idx === 0 && activeFilter === 'All' && currentPage === 1 ? 'bg-bGray/30' : ''}`}
                      >
                        <div className="flex flex-col gap-0.5 max-w-[70%]">
                          <span className={`text-sm font-medium truncate flex items-center gap-2 ${idx === 0 && activeFilter === 'All' && currentPage === 1 ? 'text-bYellow' : 'text-bText'}`}>
                            {ep.title}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-bTextSecondary">
                            <span className="px-1 bg-bGray/50 rounded text-[10px]">{ep.category}</span>
                            <span>{ep.duration} • S{ep.season}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-mono ${ep.rating > 0 ? 'text-bGreen' : 'text-bRed'}`}>
                            {ep.views}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-bTextSecondary text-sm">
                      No markets found for this category.
                    </div>
                  )}

                   {/* Pagination Controls */}
                   {filteredEpisodes.length > itemsPerPage && (
                     <div className="flex justify-between items-center p-3 border-t border-bGray bg-bDark sticky bottom-0">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1.5 px-3 py-1 bg-bGray text-xs text-white rounded hover:bg-bYellow hover:text-black disabled:opacity-30 disabled:hover:bg-bGray disabled:hover:text-white transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Prev
                        </button>
                        <span className="text-xs text-bTextSecondary">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1.5 px-3 py-1 bg-bGray text-xs text-white rounded hover:bg-bYellow hover:text-black disabled:opacity-30 disabled:hover:bg-bGray disabled:hover:text-white transition-colors"
                        >
                          Next
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                     </div>
                   )}
                </>
              )}

              {/* Trollbox / Chat */}
              {activeTab === 'trollbox' && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${comment.userIsVip ? 'text-bYellow' : 'text-bTextSecondary'}`}>
                            {comment.userName}
                          </span>
                          {comment.userIsVip && (
                            <svg className="w-3 h-3 text-bYellow" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          )}
                          <span className="text-[10px] text-bTextSecondary opacity-60">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-bText leading-snug">{comment.text}</p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <div className="p-3 border-t border-bGray bg-bGray/10">
                    {user ? (
                      <form onSubmit={handlePostComment} className="flex gap-2">
                        <input 
                          type="text" 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Say something..."
                          className="flex-1 bg-bBlack border border-bGray rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-bYellow"
                        />
                        <button type="submit" className="text-bYellow hover:text-white font-bold text-sm">Send</button>
                      </form>
                    ) : (
                      <button 
                        onClick={onOpenAuth}
                        className="w-full py-2 bg-bGray/50 border border-bGray text-bTextSecondary hover:text-white hover:border-bYellow rounded text-sm transition-colors"
                      >
                        Log In to Chat
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayView;
