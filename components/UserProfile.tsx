import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, User } from '../types';
import { api as movieApi } from '../services/shopApi';

interface UserProfileProps {
  user: User | null;
  onUpdateUser: (updatedUser: User) => void;
  onOpenAuth: () => void;
  onSubscribeVIP: () => boolean;
  rentedMovies: Movie[];
  onOpenAdmin?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUpdateUser,
  onOpenAuth,
  onSubscribeVIP,
  rentedMovies,
  onOpenAdmin
}) => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showSubSuccess, setShowSubSuccess] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12">
        <article className="overflow-hidden rounded-[4px] border border-white/10 bg-[#111] text-center">
          <header className="bg-bYellow px-5 py-4 text-black">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em]">Orbit Movie</p>
            <p className="text-xs font-semibold">Profile</p>
          </header>
          <div className="px-6 py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bYellow/15 text-bYellow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Sign in to view your profile</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/50">VIP status and account details live on this page after you log in.</p>
            <button type="button" onClick={onOpenAuth} className="mt-6 rounded-[4px] bg-bYellow px-6 py-2.5 text-sm font-bold text-black hover:bg-bYellowHover">
              Go to login
            </button>
          </div>
        </article>
      </div>
    );
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    const saved = await movieApi.updateMe({ name: nickname.trim() });
    onUpdateUser(saved);
    setIsEditing(false);
  };

  const handleSubscribeClick = () => {
    if (onSubscribeVIP()) {
      setShowSubSuccess(true);
      window.setTimeout(() => setShowSubSuccess(false), 4000);
    }
  };

  const plan = user.isAdmin ? 'Admin' : user.isVip ? 'VIP' : 'Free';

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in px-4 py-6 md:px-8 md:py-8">
      <article className="overflow-hidden rounded-[4px] border border-white/10 bg-[#111] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <header className="flex items-center justify-between gap-4 bg-bYellow px-5 py-4 text-black sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-lg font-black text-bYellow">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em]">Orbit Movie</p>
              <p className="text-xs font-semibold">My profile</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest">Account</p>
            <p className="font-mono text-lg font-black">{plan}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 border-b border-white/10 bg-black/40 text-center text-xs sm:text-sm">
          <div className="px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-bYellow">Status</p>
            <p className="mt-1 font-semibold text-white">Active</p>
          </div>
          <div className="px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-bYellow">Region</p>
            <p className="mt-1 text-white">Rwanda</p>
          </div>
        </div>

        <div className="grid gap-6 border-b border-white/10 p-5 sm:grid-cols-2 sm:p-7">
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Account</p>
            {isEditing ? (
              <form onSubmit={handleSaveChanges} className="space-y-3">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full rounded-[4px] border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-bYellow focus:outline-none"
                  required
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[4px] border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-bYellow focus:outline-none"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="rounded-[4px] bg-bYellow px-3 py-2 text-xs font-bold text-black">Save</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="rounded-[4px] border border-white/20 px-3 py-2 text-xs text-white">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-base font-semibold text-white">{user.name}</p>
                <p className="mt-1 text-sm text-white/70">{user.email}</p>
                <p className="mt-1 text-sm text-white/50">ID {user.id}</p>
                <button type="button" onClick={() => setIsEditing(true)} className="mt-4 text-xs font-bold text-bYellow hover:underline">
                  Edit details
                </button>
              </>
            )}
          </section>
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Membership</p>
            <p className="text-base font-semibold text-white">{user.isVip ? 'VIP Movie Pass' : 'Free plan'}</p>
            <p className="mt-1 text-sm text-white/70">
              {user.isVip ? 'Full catalog and locked seasons.' : 'Standard catalog access.'}
            </p>
            {user.isVip ? (
              <p className="mt-4 inline-block rounded-[4px] border border-bYellow/40 bg-bYellow/10 px-3 py-1.5 text-xs font-bold text-bYellow">Active VIP</p>
            ) : (
              <button type="button" onClick={handleSubscribeClick} className="mt-4 rounded-[4px] bg-bYellow px-4 py-2 text-xs font-bold text-black hover:bg-bYellowHover">
                Subscribe
              </button>
            )}
            {user.isAdmin && (
              <button type="button" onClick={onOpenAdmin} className="mt-3 block rounded-[4px] border border-white/20 px-4 py-2 text-xs font-bold text-white hover:border-bYellow hover:text-bYellow">
                Open admin dashboard
              </button>
            )}
            {showSubSuccess && <p className="mt-3 text-xs font-bold text-bYellow">You are now VIP.</p>}
          </section>
        </div>

        {rentedMovies.length > 0 && (
          <section className="border-t border-white/10 px-5 py-5 sm:px-7">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Watching</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {rentedMovies.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className="flex gap-3 rounded-[4px] bg-black/30 p-2 text-left"
                >
                  <img src={movie.imageUrl} alt="" className="h-16 w-12 rounded-[4px] object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{movie.title}</p>
                    <p className="text-[11px] text-white/40">{movie.genre[0]}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="border-t border-white/10 bg-black/30 px-5 py-4 text-center text-[11px] text-white/40 sm:px-7">
          Orbit Movie account
        </footer>
      </article>
    </div>
  );
};

export default UserProfile;
