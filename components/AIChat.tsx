import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSender, Movie } from '../types';
import { getAIRecommendations } from '../services/geminiService';
import { api } from '../services/movieService';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  isInline?: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, onSelectMovie, isInline = false }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: ChatSender.BOT,
      text: "Hello! I'm your crypto-powered movie assistant. Tell me what you're in the mood for. (e.g., 'Something futuristic', 'Action with plot twists')",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: ChatSender.USER,
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Call Gemini Service
    const response = await getAIRecommendations(userMsg.text);

    // Hydrate movie recommendations
    const movies = await api.fetchMovies();
    const relatedMovies = response.recommendedIds
      .map((id) => movies.find((m) => m.id === id))
      .filter((m): m is Movie => Boolean(m));

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: ChatSender.BOT,
      text: response.text,
      relatedMovies
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  if (!isOpen && !isInline) return null;

  return (
    <div 
      id="ai-chat-container"
      className={
        isInline 
          ? "flex-1 flex flex-col h-[calc(100vh-130px)] bg-bDark border border-bGray rounded-xl overflow-hidden animate-fade-in max-w-4xl mx-auto w-full shadow-2xl" 
          : "fixed bottom-4 right-4 z-40 w-[90vw] md:w-[400px] h-[600px] bg-bDark border border-bGray shadow-2xl rounded-xl flex flex-col overflow-hidden animate-slide-up"
      }
    >
      {/* Header */}
      <div className="bg-bGray p-4 flex items-center justify-between border-b border-bBlack shrink-0">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-bGreen animate-pulse" />
           <span className="font-bold text-white">Binance AI Assistant</span>
        </div>
        {!isInline && (
          <button onClick={onClose} className="text-bTextSecondary hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-bBlack/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === ChatSender.USER ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] px-4 py-2 rounded-lg text-sm leading-relaxed ${
                msg.sender === ChatSender.USER 
                ? 'bg-bYellow text-black font-medium' 
                : 'bg-bGray text-bText'
              }`}
            >
              {msg.text}
            </div>
            
            {/* Recommended Movies Cards inside Chat */}
            {msg.relatedMovies && msg.relatedMovies.length > 0 && (
               <div className="mt-3 grid gap-2 w-full max-w-[85%]">
                 {msg.relatedMovies.map(movie => (
                   <div 
                      key={movie.id}
                      onClick={() => onSelectMovie(movie)}
                      className="flex gap-3 bg-bDark border border-bGray hover:border-bYellow p-2 rounded cursor-pointer transition-colors"
                   >
                      <img src={movie.imageUrl} alt={movie.title} className="w-12 h-16 object-cover rounded bg-bGray" />
                      <div className="flex flex-col justify-center overflow-hidden">
                        <span className="text-white font-semibold truncate text-sm">{movie.title}</span>
                        <div className="flex items-center gap-2 text-xs text-bTextSecondary">
                           <span className="text-bYellow">★ {movie.rating}</span>
                           <span>{movie.year}</span>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-bTextSecondary text-xs">
            <div className="w-2 h-2 bg-bYellow rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-bYellow rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-bYellow rounded-full animate-bounce delay-200" />
            Computing...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-bGray border-t border-bBlack flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI..."
          className="flex-1 bg-bBlack text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-bYellow"
        />
        <button 
          type="submit"
          disabled={isLoading}
          className="bg-bYellow text-black px-4 py-2 rounded font-bold text-sm hover:bg-bYellowHover disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat;
