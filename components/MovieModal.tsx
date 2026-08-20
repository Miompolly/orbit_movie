
import React, { useState, useEffect, useRef } from 'react';
import { Movie, Comment } from '../types';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
  startPlaying?: boolean;
}

const MovieModal: React.FC<MovieModalProps> = ({ 
  movie, 
  onClose, 
  isWatchlisted, 
  onToggleWatchlist,
  startPlaying = false
}) => {
  // Hooks must be top-level
  const [showTrailer, setShowTrailer] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments'>('overview');
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Actions State
  const [isWatching, setIsWatching] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Video Ref for auto-play
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (movie) {
      // Reset states when movie changes
      setShowTrailer(!!movie.trailerUrl);
      setActiveTab('overview');
      setIsLiked(false);
      setIsMinimized(false);
      setIsWatching(startPlaying);
      
      // Mock initial comments
      setComments([
        { id: '1', userId: 'u1', userName: 'MovieBuff', userIsVip: true, text: 'The trailer looks insane!', timestamp: '2h ago' },
        { id: '2', userId: 'u2', userName: 'StreamerX', userIsVip: false, text: 'Can\'t wait to watch full.', timestamp: '5h ago' }
      ]);
    }
  }, [movie, startPlaying]);

  useEffect(() => {
    if (showTrailer && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Autoplay prevented by browser:', error);
        });
      }
    }
  }, [showTrailer]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      userId: 'guest',
      userName: 'Guest User',
      userIsVip: false,
      text: newComment,
      timestamp: 'Just now'
    };
    
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleCloseAction = () => {
    if (showTrailer && !isMinimized) {
        setIsMinimized(true);
    } else {
        onClose();
    }
  };

  if (!movie) return null;

  const partsCount = movie.episodes?.length || 1;
  const isEpisodeShow =
    movie.genre?.some((g) => /series|tv show/i.test(g)) ||
    (movie.episodes?.some((ep) => /episode/i.test(ep.title)) ?? false);
  const partsLabel = isEpisodeShow
    ? `${partsCount} ${partsCount === 1 ? 'Episode' : 'Episodes'}`
    : partsCount > 1
      ? `${partsCount} Parts`
      : null;

  const videoSrc = isWatching
    ? (movie.episodes?.[0]?.url || movie.trailerUrl)
    : movie.trailerUrl;

  const handlePlayOnPage = () => {
    setIsWatching(true);
    setShowTrailer(true);
    setIsMinimized(false);
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-bBlack overflow-y-auto animate-fade-in">
      <div className={`${
         isMinimized 
         ? 'fixed bottom-6 right-6 w-80 sm:w-96 h-auto rounded-[4px] overflow-hidden z-[70]' 
         : 'w-full min-h-full'
      }`}>
        
        <div className="relative w-full aspect-video bg-black group">
           <div className={`absolute top-0 left-0 right-0 p-3 z-20 flex justify-between items-start transition-opacity ${isMinimized ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
               <div>
                   {isMinimized ? (
                       <button 
                         onClick={() => setIsMinimized(false)}
                         className="flex items-center gap-2 bg-black/55 hover:bg-black/80 text-white px-2 py-1.5 rounded-[4px] backdrop-blur-sm transition-all"
                         title="Expand"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                         </svg>
                       </button>
                   ) : (
                       <button 
                         onClick={onClose}
                         className="flex items-center gap-2 bg-black/55 hover:bg-black/80 text-white px-3 py-1.5 rounded-[4px] backdrop-blur-sm transition-all"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                         </svg>
                         <span className="text-xs font-semibold">Back</span>
                       </button>
                   )}
               </div>

               <div className="flex items-center gap-2">
                   {!isMinimized && showTrailer && (
                       <button 
                         onClick={() => setIsMinimized(true)}
                         className="p-2 bg-black/55 rounded-[4px] text-white hover:text-bYellow hover:bg-black transition-all"
                         title="Minimize"
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                       </button>
                   )}
                   <button 
                     onClick={isMinimized ? onClose : handleCloseAction}
                     className="p-2 bg-black/55 rounded-[4px] text-white hover:text-bRed hover:bg-black transition-all"
                     title="Close"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
               </div>
           </div>

           {videoSrc ? (
             <video 
               ref={videoRef}
               key={`${movie.id}-${isWatching ? 'watch' : 'trailer'}`}
               src={videoSrc} 
               className="w-full h-full object-cover"
               controls={!isMinimized}
               autoPlay
               playsInline
               muted={!isWatching}
             />
           ) : (
             <>
               <img 
                  src={movie.backdropUrl} 
                  alt={movie.title}
                  className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-bBlack via-black/20 to-transparent" />
               
               {movie.trailerUrl && (
                 <button 
                   onClick={() => setShowTrailer(true)}
                   className="absolute inset-0 flex items-center justify-center group/play"
                 >
                   <div className="w-16 h-16 bg-bYellow rounded-full flex items-center justify-center shadow-[0_8px_28px_rgba(252,213,53,0.4)] group-hover/play:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-black ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                   </div>
                 </button>
               )}
             </>
           )}
           
            <span className="absolute left-3 bottom-3 z-20 rounded-[4px] bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {isWatching ? 'Now Playing' : 'Trailer'}
            </span>
           
           {isMinimized && (
               <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent pointer-events-none">
                   <h4 className="text-white font-semibold text-sm truncate">{movie.title}</h4>
                   <p className="text-bYellow text-xs">{isWatching ? 'Now Playing' : 'Trailer'}</p>
               </div>
           )}
        </div>

        <div className={`bg-bBlack ${isMinimized ? 'hidden' : ''}`}>
            <div className="px-5 md:px-8 pt-5 pb-4">
               <div className="flex flex-wrap items-center gap-2 mb-2">
                  {movie.trending && (
                    <span className="bg-bYellow text-black text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wide">Hot</span>
                  )}
                  <span className="text-bYellow text-xs font-semibold uppercase tracking-wide">{movie.genre[0]}</span>
                  {movie.region && (
                    <span className="text-[10px] uppercase tracking-wider text-bTextSecondary">{movie.region}</span>
                  )}
               </div>

               <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">{movie.title}</h2>

               <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-bTextSecondary">
                  <span className="text-bYellow font-semibold">★ {movie.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-white/20">·</span>
                  <span>{movie.year}</span>
                  <span className="text-white/20">·</span>
                  <span>{movie.duration}</span>
                  {partsLabel && (
                    <>
                      <span className="text-white/20">·</span>
                      <span>{partsLabel}</span>
                    </>
                  )}
               </div>

               <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button 
                    onClick={handlePlayOnPage}
                    className="bg-bYellow text-black px-6 py-2.5 rounded-[4px] font-bold hover:bg-bYellowHover transition-colors flex items-center justify-center gap-2"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                     </svg>
                     {isWatching ? 'Playing' : 'Play'}
                  </button>

               <button 
                 onClick={onToggleWatchlist}
                 className={`px-3.5 py-2.5 rounded-[4px] transition-colors flex items-center gap-2 text-sm font-medium ${isWatchlisted ? 'bg-bGreen/15 text-bGreen' : 'bg-white/5 text-white hover:bg-white/10'}`}
               >
                  {isWatchlisted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <span>{isWatchlisted ? 'In My List' : 'My List'}</span>
               </button>

               <button 
                 onClick={() => setIsLiked(!isLiked)}
                 className={`px-3.5 py-2.5 rounded-[4px] transition-colors flex items-center gap-2 text-sm font-medium ${isLiked ? 'bg-bRed/15 text-bRed' : 'bg-white/5 text-white hover:bg-white/10'}`}
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
               </button>
            </div>
         </div>

            <div className="flex-1 overflow-y-auto">
               <div className="flex gap-6 px-5 md:px-8 border-b border-white/10 sticky top-0 bg-bBlack z-10">
                  <button 
                    onClick={() => setActiveTab('overview')}
                    className={`py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === 'overview' ? 'border-bYellow text-white' : 'border-transparent text-bTextSecondary hover:text-white'}`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setActiveTab('comments')}
                    className={`py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeTab === 'comments' ? 'border-bYellow text-white' : 'border-transparent text-bTextSecondary hover:text-white'}`}
                  >
                    Comments <span className="text-bTextSecondary font-medium">({comments.length})</span>
                  </button>
               </div>

               <div className="p-5 md:p-8 min-h-[240px]">
                 {activeTab === 'overview' ? (
                    <div className="grid md:grid-cols-12 gap-8 animate-fade-in">
                      <div className="md:col-span-8 space-y-5">
                        <div>
                          <h4 className="text-white font-semibold mb-2 text-base">Synopsis</h4>
                          <p className="text-bTextSecondary leading-relaxed text-[15px]">{movie.description}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 pt-1">
                           {(movie.genre || []).map(g => (
                             <span key={g} className="px-2.5 py-1 bg-white/5 text-white/80 text-[11px] rounded-[4px]">{g}</span>
                           ))}
                        </div>
                      </div>

                      <div className="md:col-span-4 space-y-4 text-sm">
                         <div className="space-y-3">
                           <div>
                             <span className="block text-bTextSecondary mb-1 text-[11px] uppercase tracking-wider">Cast</span>
                             <div className="text-white/90">{movie.cast.join(', ')}</div>
                           </div>
                           <div>
                             <span className="block text-bTextSecondary mb-1 text-[11px] uppercase tracking-wider">Region</span>
                             <div className="text-white/90">{movie.region || 'International'}</div>
                           </div>
                           <div>
                             <span className="block text-bTextSecondary mb-1 text-[11px] uppercase tracking-wider">Quality</span>
                             <div className="flex items-center gap-1.5 mt-1">
                               <span className="px-1.5 py-0.5 bg-white/5 rounded-[4px] text-[10px] text-white/70 font-semibold">4K</span>
                               <span className="px-1.5 py-0.5 bg-white/5 rounded-[4px] text-[10px] text-white/70 font-semibold">HDR</span>
                               <span className="px-1.5 py-0.5 bg-white/5 rounded-[4px] text-[10px] text-white/70 font-semibold">ATMOS</span>
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>
                 ) : (
                    <div className="animate-fade-in max-w-2xl">
                       <form onSubmit={handlePostComment} className="mb-7 flex gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-bTextSecondary shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <input 
                              type="text" 
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..." 
                              className="w-full bg-white/5 rounded-[4px] px-4 py-2.5 text-sm text-white placeholder-bTextSecondary focus:outline-none focus:ring-1 focus:ring-bYellow/50"
                            />
                            <div className="flex justify-end mt-2">
                               <button type="submit" className="bg-bYellow text-black px-4 py-1.5 rounded-[4px] text-xs font-bold hover:bg-bYellowHover transition-colors">Post</button>
                            </div>
                          </div>
                       </form>

                       <div className="space-y-5">
                          {comments.map(c => (
                            <div key={c.id} className="flex gap-3">
                               <div className="w-9 h-9 rounded-full bg-bYellow/15 flex items-center justify-center text-bYellow text-sm font-bold shrink-0">
                                 {c.userName.charAt(0).toUpperCase()}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5 gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                       <span className="text-white font-semibold text-sm truncate">{c.userName}</span>
                                       {c.userIsVip && <span className="text-[9px] bg-bYellow text-black px-1 py-px rounded-[3px] font-bold">VIP</span>}
                                    </div>
                                    <span className="text-[11px] text-bTextSecondary shrink-0">{c.timestamp}</span>
                                  </div>
                                  <p className="text-bTextSecondary text-sm leading-relaxed">{c.text}</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 )}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
