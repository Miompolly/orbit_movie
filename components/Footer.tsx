
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api as movieApi } from '../services/shopApi';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactStatus('sending');
    try {
      await movieApi.sendContact({ name: contactName, email: contactEmail, message: contactMessage });
      setContactStatus('sent');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setTimeout(() => setContactStatus('idle'), 3000);
    } catch {
      setContactStatus('error');
      setTimeout(() => setContactStatus('idle'), 3000);
    }
  };

  const handleClick = (tab: string, path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) onNavigate(tab);
    navigate(path);
  };

  return (
    <footer className="bg-bBlack border-t border-bGray mt-auto">
      <div className="px-6 md:px-10 py-12">
        <div className="mb-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
              <circle cx="20" cy="20" r="20" fill="#FCD535" />
              <path fill="#070910" d="M15.8 12.15c0-1.02 1.12-1.64 1.98-1.1l12.35 7.55c.82.5.82 1.7 0 2.2L17.78 28.35c-.86.54-1.98-.08-1.98-1.1V12.15z" />
            </svg>
            <span className="text-lg font-black tracking-[0.14em] text-bYellow">Orbit Movie</span>
          </div>
          <p className="text-xs text-bTextSecondary max-w-sm leading-relaxed">
            Watch movies and series with Kinyarwanda narration or original audio. Watch anywhere, anytime.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-bTextSecondary">Navigate</h4>
            <ul className="space-y-2 text-sm text-bText">
              <li><a href="/" onClick={handleClick('home', '/')} className="hover:text-bYellow transition-colors">Home</a></li>
              <li><a href="/movies" onClick={handleClick('movies', '/movies')} className="hover:text-bYellow transition-colors">Movies</a></li>
              <li><a href="/series" onClick={handleClick('series', '/series')} className="hover:text-bYellow transition-colors">Series</a></li>
              <li><a href="/watchlist" onClick={handleClick('watchlist', '/watchlist')} className="hover:text-bYellow transition-colors">Watchlist</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-bTextSecondary">Support</h4>
            <ul className="space-y-2 text-sm text-bText">
              <li><a href={`mailto:support@${hostname}`} className="hover:text-bYellow transition-colors">Help Center</a></li>
              <li><a href={`${origin}/terms`} target="_blank" rel="noopener noreferrer" className="hover:text-bYellow transition-colors">Terms of Service</a></li>
              <li><a href={`${origin}/privacy`} target="_blank" rel="noopener noreferrer" className="hover:text-bYellow transition-colors">Privacy Policy</a></li>
              <li><a href={`${origin}/cookies`} target="_blank" rel="noopener noreferrer" className="hover:text-bYellow transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-bTextSecondary">Community</h4>
            <ul className="space-y-2 text-sm text-bText">
              <li><a href="https://discord.gg/movieexchange" target="_blank" rel="noopener noreferrer" className="hover:text-bYellow transition-colors">Discord</a></li>
              <li><a href="https://twitter.com/movieexchange" target="_blank" rel="noopener noreferrer" className="hover:text-bYellow transition-colors">Twitter</a></li>
              <li><a href="https://t.me/movieexchange" target="_blank" rel="noopener noreferrer" className="hover:text-bYellow transition-colors">Telegram</a></li>
              <li><a href="https://instagram.com/movieexchange" target="_blank" rel="noopener noreferrer" className="hover:text-bYellow transition-colors">Instagram</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-bTextSecondary">Contact Us</h4>
            <form onSubmit={handleContactSubmit} className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="bg-bDark border border-bGray rounded px-3 py-2 text-xs text-white placeholder-bTextSecondary focus:outline-none focus:border-bYellow"
              />
              <input
                type="email"
                placeholder="Email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="bg-bDark border border-bGray rounded px-3 py-2 text-xs text-white placeholder-bTextSecondary focus:outline-none focus:border-bYellow"
              />
              <textarea
                placeholder="Message"
                rows={2}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="bg-bDark border border-bGray rounded px-3 py-2 text-xs text-white placeholder-bTextSecondary focus:outline-none focus:border-bYellow resize-none"
              />
              <button
                type="submit"
                disabled={contactStatus === 'sending'}
                className="bg-bYellow hover:bg-bYellowHover text-black font-bold px-4 py-2 rounded text-xs transition-colors w-fit disabled:opacity-50"
              >
                {contactStatus === 'sending' ? 'Sending...' : contactStatus === 'sent' ? 'Sent!' : contactStatus === 'error' ? 'Failed' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-bGray text-center text-bTextSecondary text-xs space-y-2">
          <p>&copy; {new Date().getFullYear()} Orbit Movie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
