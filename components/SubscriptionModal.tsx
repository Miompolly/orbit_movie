import React from 'react';
import { User } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubscribe: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, user, onSubscribe }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-bDark w-full max-w-2xl rounded-xl shadow-2xl border border-bGray overflow-hidden flex flex-col md:flex-row">
        
        {/* Free Plan */}
        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-bGray flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2">Free Account</h3>
          <p className="text-bTextSecondary text-sm mb-6">Standard market access.</p>
          <div className="text-3xl font-bold text-white mb-6">0 <span className="text-sm font-normal text-bTextSecondary">USDT/mo</span></div>
          
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-2 text-sm text-bText">
              <svg className="w-5 h-5 text-bGray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Watch Movies (Ads)
            </li>
            <li className="flex items-center gap-2 text-sm text-bText">
              <svg className="w-5 h-5 text-bGray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Standard 720p Quality
            </li>
            <li className="flex items-center gap-2 text-sm text-bText">
              <svg className="w-5 h-5 text-bGray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Read-only Trollbox
            </li>
          </ul>

          <button 
             onClick={onClose}
             className="w-full py-3 rounded border border-bGray text-bText hover:bg-bGray transition-colors"
          >
            Continue Free
          </button>
        </div>

        {/* VIP Plan */}
        <div className="flex-1 p-8 bg-gradient-to-br from-bDark to-bYellow/10 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-bYellow text-black text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
          
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            VIP Trader 
            <span className="text-bYellow text-xs px-2 py-0.5 border border-bYellow rounded">PRO</span>
          </h3>
          <p className="text-bTextSecondary text-sm mb-6">Maximum performance & privileges.</p>
          <div className="text-3xl font-bold text-white mb-6">9.99 <span className="text-sm font-normal text-bTextSecondary">USDT/mo</span></div>
          
          <ul className="space-y-3 mb-8 flex-1">
             <li className="flex items-center gap-2 text-sm text-white">
              <svg className="w-5 h-5 text-bYellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Ad-Free Movies
            </li>
            <li className="flex items-center gap-2 text-sm text-white">
              <svg className="w-5 h-5 text-bYellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              4K Ultra HD & HDR
            </li>
            <li className="flex items-center gap-2 text-sm text-white">
              <svg className="w-5 h-5 text-bYellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              VIP Badge in Trollbox
            </li>
            <li className="flex items-center gap-2 text-sm text-white">
              <svg className="w-5 h-5 text-bYellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Exclusive Early Access
            </li>
          </ul>

          <button 
            onClick={() => {
              onSubscribe();
              onClose();
            }}
            className="w-full py-3 rounded bg-bYellow text-black font-bold hover:bg-bYellowHover transition-colors shadow-lg shadow-bYellow/20"
          >
            Upgrade Now
          </button>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionModal;
