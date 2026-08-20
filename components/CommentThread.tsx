import React, { useMemo, useState } from 'react';
import { Comment, User } from '../types';
import { guestId } from '../services/apiClient';

interface CommentThreadProps {
  comments: Comment[];
  user: User | null;
  onPost: (text: string, parentId?: string) => Promise<void> | void;
  onLike: (commentId: string) => Promise<void> | void;
  onPin?: (commentId: string) => Promise<void> | void;
}

const timeLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const sortPinnedFirst = (list: Comment[]) =>
  [...list].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    const pinA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
    const pinB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
    return pinB - pinA;
  });

const CommentCard: React.FC<{
  comment: Comment;
  user: User | null;
  liker: string;
  replies: Comment[];
  byParent: Map<string, Comment[]>;
  onPost: CommentThreadProps['onPost'];
  onLike: CommentThreadProps['onLike'];
  onPin?: CommentThreadProps['onPin'];
  nested?: boolean;
}> = ({ comment, user, liker, replies, byParent, onPost, onLike, onPin, nested }) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const liked = (comment.likedBy || []).includes(liker);
  const likes = (comment.likedBy || []).length;
  const pinned = Boolean(comment.pinned);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onPost(replyText.trim(), comment.id);
    setReplyText('');
    setReplyOpen(false);
  };

  return (
    <div className={nested ? 'mt-3' : ''}>
      <div
        className={`flex gap-3 ${
          pinned
            ? 'rounded-[4px] border border-bYellow bg-bYellow/20 px-3 py-3'
            : ''
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bYellow/15 text-sm font-bold text-bYellow">
          {comment.userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <span className={`truncate text-sm font-semibold ${pinned ? 'text-bYellow' : 'text-white'}`}>
              {comment.userName}
              {pinned ? <span className="ml-2 text-[10px] font-bold text-bYellow">PINNED</span> : null}
              {comment.isAdmin ? <span className="ml-2 text-[10px] font-bold text-bYellow">ADMIN</span> : null}
              {comment.userIsVip && !comment.isAdmin ? <span className="ml-2 text-[10px] font-bold text-bYellow">VIP</span> : null}
            </span>
            <span className={`shrink-0 text-[11px] ${pinned ? 'text-bYellow/70' : 'text-white/40'}`}>
              {timeLabel(comment.timestamp)}
            </span>
          </div>
          <p className={`text-sm leading-relaxed ${pinned ? 'font-medium text-bYellow' : 'text-white/70'}`}>
            {comment.text}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={() => onLike(comment.id)} className={`text-xs font-semibold ${liked || pinned ? 'text-bYellow' : 'text-white/45 hover:text-white'}`}>
              ♥ {likes}
            </button>
            <button type="button" onClick={() => setReplyOpen((v) => !v)} className={`text-xs font-semibold ${pinned ? 'text-bYellow/80 hover:text-bYellow' : 'text-white/45 hover:text-white'}`}>
              Reply
            </button>
            {user?.isAdmin && onPin ? (
              <button
                type="button"
                onClick={() => onPin(comment.id)}
                className="text-xs font-semibold text-bYellow hover:text-bYellowHover"
              >
                {pinned ? 'Unpin' : 'Pin'}
              </button>
            ) : null}
          </div>
          {replyOpen ? (
            <form onSubmit={sendReply} className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={user?.isAdmin ? 'Reply as admin...' : 'Write a reply...'}
                className="w-full rounded-[4px] bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 outline-none"
              />
              <button type="submit" className="rounded-[4px] bg-bYellow px-3 py-1.5 text-xs font-bold text-black">Send</button>
            </form>
          ) : null}
          {sortPinnedFirst(replies).map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              user={user}
              liker={liker}
              replies={byParent.get(reply.id) || []}
              byParent={byParent}
              onPost={onPost}
              onLike={onLike}
              onPin={onPin}
              nested
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CommentThread: React.FC<CommentThreadProps> = ({ comments, user, onPost, onLike, onPin }) => {
  const [text, setText] = useState('');
  const liker = user?.id || guestId();
  const roots = useMemo(
    () => sortPinnedFirst(comments.filter((item) => !item.parentId)),
    [comments]
  );
  const byParent = useMemo(() => {
    const map = new Map<string, Comment[]>();
    comments.forEach((item) => {
      if (!item.parentId) return;
      const list = map.get(item.parentId) || [];
      list.push(item);
      map.set(item.parentId, list);
    });
    return map;
  }, [comments]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onPost(text.trim());
    setText('');
  };

  return (
    <div>
      <form onSubmit={submit} className="mb-6">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user?.isAdmin ? 'Comment as admin...' : 'Add a comment...'}
          className="w-full rounded-[4px] bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-bYellow/50"
        />
        <div className="mt-2 flex justify-end">
          <button type="submit" className="rounded-[4px] bg-bYellow px-4 py-1.5 text-xs font-bold text-black hover:bg-bYellowHover">
            Post
          </button>
        </div>
      </form>
      <div className="space-y-5 pb-8">
        {roots.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            user={user}
            liker={liker}
            replies={byParent.get(comment.id) || []}
            byParent={byParent}
            onPost={onPost}
            onLike={onLike}
            onPin={onPin}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentThread;
