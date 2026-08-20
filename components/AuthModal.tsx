
import React, { useState } from 'react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock API Call
    setTimeout(() => {
      const isAdmin = email.includes('admin');
      const mockUser: User = {
        id: Date.now().toString(),
        name: isLogin ? (email.split('@')[0] || 'Trader') : name,
        email: email,
        isVip: isAdmin, // Admins get VIP features too
        isAdmin: isAdmin
      };
      onLogin(mockUser);
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-bDark w-full max-w-md p-8 rounded-xl shadow-2xl border border-bGray relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-bTextSecondary hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          {isLogin ? 'Log In' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-bTextSecondary mb-1">Nickname</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bBlack border border-bGray rounded p-3 text-white focus:outline-none focus:border-bYellow transition-colors"
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-bTextSecondary mb-1">Email / Phone</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Hint: use 'admin' in email for Admin rights"
              className="w-full bg-bBlack border border-bGray rounded p-3 text-white focus:outline-none focus:border-bYellow transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-bTextSecondary mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bBlack border border-bGray rounded p-3 text-white focus:outline-none focus:border-bYellow transition-colors"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-bYellow text-black font-bold py-3 rounded hover:bg-bYellowHover transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Register')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-bTextSecondary">
          {isLogin ? "Not registered yet? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-bYellow hover:underline font-medium"
          >
            {isLogin ? 'Create an Account' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
