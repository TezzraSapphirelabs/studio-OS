'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { subscribeToComments, createComment, deleteComment } from '@/services/comments';
import { type Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { TrashIcon } from '@/components/icons';
import { getInitials } from '@/utils';

interface CommentSectionProps {
  entityId: string;
  entityType: 'project' | 'task' | 'note';
  projectId?: string;
}

export function CommentSection({ entityId, entityType, projectId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityId || !projectId) return;
    const unsub = subscribeToComments(entityId, projectId, setComments, setError);
    return () => { unsub.then(u => u()); };
  }, [entityId, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    const { error: submitErr } = await createComment(
      user.uid,
      user.displayName || 'Unknown',
      user.photoURL,
      entityId,
      entityType,
      projectId,
      newComment
    );
    if (submitErr) setError(submitErr);
    else setNewComment('');
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    const { error: delErr } = await deleteComment(commentId);
    if (delErr) alert(delErr);
  };

  // Basic regex to style @mentions
  const renderContent = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, i) => 
      part.startsWith('@') ? <span key={i} className="font-medium text-violet-400">{part}</span> : part
    );
  };

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.06] bg-[#0a0a0f] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <h3 className="font-semibold text-white">Comments ({comments.length})</h3>
      </div>
      
      <div className="flex flex-col gap-4 p-5">
        <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-white/40 italic">No comments yet. Start the conversation!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3 group">
                <div className="shrink-0 mt-0.5">
                  {comment.authorPhotoURL ? (
                    <Image src={comment.authorPhotoURL} alt={comment.authorName} width={32} height={32} className="h-8 w-8 rounded-full object-cover" unoptimized />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white shadow-inner">
                      {getInitials(comment.authorName, '')}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{comment.authorName}</span>
                    <span className="text-[10px] text-white/40">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="mt-1 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                    {renderContent(comment.content)}
                  </p>
                </div>
                {user?.uid === comment.authorId && (
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400/50 hover:text-red-400"
                  >
                    <TrashIcon size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="mt-4 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment... Use @ to mention someone"
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 pr-12 text-sm text-white placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/[0.04] focus:outline-none"
            rows={2}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || loading}
            className="absolute bottom-3 right-3 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? '...' : 'Post'}
          </button>
        </form>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
