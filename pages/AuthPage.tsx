import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { ADMIN_ACCOUNT } from '../services/authService';
import { api as movieApi } from '../services/shopApi';

interface AuthPageProps {
  onLogin: (user: User) => void | Promise<void>;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname !== '/register';
  const from = (location.state as { from?: string } | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const goAfterAuth = (user: User) => {
    const next = user.isAdmin
      ? '/admin'
      : from && from !== '/login' && from !== '/register'
        ? from
        : '/';
    navigate(next, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = isLogin
        ? await movieApi.login(email, password)
        : await movieApi.register(name, email, password);
      await onLogin(user);
      goAfterAuth(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 animate-fade-in">
      <h1 className="mb-2 text-2xl font-bold text-white">{isLogin ? 'Log In' : 'Create Account'}</h1>
      <p className="mb-6 text-sm text-white/50">
        {isLogin ? 'Sign in to your Orbit Movie account.' : 'Create a new Orbit Movie account.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[4px] bg-[#1c1c1c] p-6">
        {!isLogin && (
          <label className="block text-xs font-medium text-white/50">
            Nickname
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-[4px] border border-white/15 bg-black/40 p-3 text-sm text-white focus:border-bYellow focus:outline-none"
            />
          </label>
        )}
        <label className="block text-xs font-medium text-white/50">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="mt-1 w-full rounded-[4px] border border-white/15 bg-black/40 p-3 text-sm text-white focus:border-bYellow focus:outline-none"
          />
        </label>
        <label className="block text-xs font-medium text-white/50">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className="mt-1 w-full rounded-[4px] border border-white/15 bg-black/40 p-3 text-sm text-white focus:border-bYellow focus:outline-none"
          />
        </label>
        {error ? <p className="text-xs text-bRed">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[4px] bg-bYellow py-3 font-bold text-black hover:bg-bYellowHover disabled:opacity-50"
        >
          {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Register'}
        </button>
      </form>

      {isLogin ? (
        <div className="mt-4 rounded-[4px] border border-white/10 bg-[#1c1c1c] px-4 py-3 text-xs text-white/60">
          <p className="font-semibold text-bYellow">Admin user</p>
          <p className="mt-1 font-mono text-white">{ADMIN_ACCOUNT.email}</p>
          <p className="font-mono text-white">Password: {ADMIN_ACCOUNT.password}</p>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-white/50">
        {isLogin ? 'Not registered yet? ' : 'Already have an account? '}
        <button
          type="button"
          onClick={() => navigate(isLogin ? '/register' : '/login', { state: { from } })}
          className="font-medium text-bYellow hover:underline"
        >
          {isLogin ? 'Create an Account' : 'Log In'}
        </button>
      </p>
    </div>
  );
};

export default AuthPage;
