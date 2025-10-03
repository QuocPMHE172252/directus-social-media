"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FeedPost } from '@/lib/social/fetchers';
import { ReactionBar } from '@/components/social/ReactionBar';

export function PostCard({ post }: { post: FeedPost }) {
  const [commentCount, setCommentCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(post.title ?? '');
  const [displayContent, setDisplayContent] = useState(post.content ?? '');
  const [editTitle, setEditTitle] = useState(post.title ?? '');
  const [editContent, setEditContent] = useState(post.content ?? '');
  const [canEdit, setCanEdit] = useState(false);

  // Determine if current user is author
  useEffect(() => {
    async function check() {
      try {
        const r = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await r.json();
        const uid = data?.user?.id || null;
        setCanEdit(Boolean(uid && post.authorId && String(uid) === String(post.authorId)));
      } catch {
        setCanEdit(false);
      }
    }
    check();
  }, [post.authorId]);

  // ThÃªm useEffect Ä‘á»ƒ fetch comment count khi component mount
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const response = await fetch(`/api/comments/count?postId=${post.id}`);
        if (response.ok) {
          const data = await response.json();
          if (typeof data?.count === 'number' && data.count >= 0) {
            setCommentCount(data.count);
          }
        }
      } catch {}
    };

    fetchCommentCount();
  }, [post.id]);

  // Fetch comments khi má»Ÿ popup
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?postId=${post.id}&page=1&pageSize=10`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch {}
  };

  // Format thá»i gian
  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  // Láº¥y kÃ½ tá»± Ä‘áº§u cá»§a tÃªn Ä‘á»ƒ lÃ m avatar
  const getInitials = (name: string | null) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  // Format sá»‘ comment
  const formatCommentCount = (count: number) => {
    if (count === 0) return '0 comments';
    if (count === 1) return '1 comment';
    return `${count} comments`;
  };

  // Refresh comment count
  const handleCommentAdded = async () => {
    try {
      const response = await fetch(`/api/comments/count?postId=${post.id}`);
      if (response.ok) {
        const data = await response.json();
        if (typeof data?.count === 'number' && data.count >= 0) {
          setCommentCount(data.count);
        }
      }
    } catch {}
  };

  // Má»Ÿ popup comment
  const handleCommentClick = () => {
    setShowComments(true);
    setCommentError(null);
  };

  // ÄÃ³ng popup comment
  const handleCloseComments = () => {
    setShowComments(false);
    setCommentError(null);
  };

  // Submit Edit
  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (res.ok) {
        setDisplayTitle(editTitle);
        setDisplayContent(editContent);
        setEditing(false);
      }
    } catch {}
  };

  // Delete post
  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        // Optimistic: hide content
        (document.getElementById(`post-${post.id}`) as HTMLElement | null)?.remove();
      }
    } catch {
      // Ignore errors
    }
  };

  // Gá»­i comment má»›i
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    setCommentError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId: post.id, content: newComment }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewComment('');
        await fetchComments();
        await handleCommentAdded();
        setCommentError(null);
      } else if (response.status === 401) {
        setCommentError('âŒ Please login to comment');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      } else {
        setCommentError(`âŒ Failed to comment: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setCommentError(`âŒ Error: ${error}`);
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <article id={`post-${post.id}`} className="bg-white dark:bg-neutral-900 dark:text-neutral-100 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-12 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-semibold">
              {getInitials(post.authorName)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 dark:text-neutral-100 truncate">
              {post.authorName || 'User'}
            </div>
            <div className="text-xs text-gray-500 dark:text-neutral-400 flex items-center gap-1">
              <span className="truncate">{formatTime(post.createdAt ?? null)}</span>
              <span>â€¢</span>
              <span>ðŸŒ</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <>
              <button onClick={() => setEditing(true)} className="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-neutral-800">Edit</button>
              <button onClick={handleDelete} className="px-2 py-1 text-sm rounded hover:bg-red-50 text-red-600">Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        {post.title && (
          <h2 className="text-[15px] sm:text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2 break-words">{displayTitle}</h2>
        )}
        {post.content && (
          <div className="text-[15px] sm:text-base leading-relaxed text-gray-800 dark:text-neutral-200 mb-2 break-words whitespace-pre-wrap">
            <div className={!expanded ? 'overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]' : ''}>{displayContent}</div>
          </div>
        )}
        {post.content && post.content.length > 200 && (
          <button onClick={() => setExpanded((v) => !v)} className="text-blue-600 text-sm hover:underline">
            {expanded ? 'Thu gá»n' : 'Xem thÃªm'}
          </button>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-md">
          <Image 
            src={`/api/image-proxy?id=${post.image}`} 
            alt={post.title ?? 'post image'} 
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
            className="object-cover transition-transform duration-200 hover:scale-[1.01]"
          />
        </div>
      )}

      {/* Meta (counts) */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-neutral-800">
        <div className="text-sm text-gray-600 dark:text-neutral-400">
          {formatCommentCount(commentCount)}
        </div>
      </div>

      {/* Action Bar */}
      <div className="grid grid-cols-3 divide-x border-y border-gray-100 dark:border-neutral-800">
        <button onClick={() => {}} className="flex items-center justify-center gap-2 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
          <svg className="size-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a6 6 0 016-6h6a2 2 0 012 2v8a2 2 0 01-2 2H9l-3.5 2.5A1 1 0 014 17.8V16a6 6 0 01-2-6z"/></svg>
          <span className="font-medium">Like</span>
        </button>
        <button onClick={handleCommentClick} className="flex items-center justify-center gap-2 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
          <svg className="size-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg>
          <span className="font-medium">Comment</span>
        </button>
        <button onClick={() => {}} className="flex items-center justify-center gap-2 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
          <svg className="size-5" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 11-6 0 3 3 0 016 0z"/><path fillRule="evenodd" d="M2 12.5A4.5 4.5 0 016.5 8h7A4.5 4.5 0 0118 12.5V15a1 1 0 01-1 1H3a1 1 0 01-1-1v-2.5z"/></svg>
          <span className="font-medium">Share</span>
        </button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditing(false)}>
          <div className="w-full max-w-xl rounded-md bg-white dark:bg-neutral-900 dark:text-neutral-100 p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Edit Post</h3>
              <button onClick={() => setEditing(false)} className="text-sm">Close</button>
            </div>
            <div className="space-y-2">
              <input className="w-full rounded border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 border-gray-300 dark:border-neutral-700" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
              <textarea className="w-full rounded border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 border-gray-300 dark:border-neutral-700" rows={6} value={editContent || ''} onChange={(e) => setEditContent(e.target.value)} placeholder="Content" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(false)} className="rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800">Cancel</button>
                <button onClick={handleSaveEdit} className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal - Táº¡o popup riÃªng */}
      {showComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseComments}>
          <div className="w-full max-w-xl rounded-md bg-white dark:bg-neutral-900 dark:text-neutral-100 p-4 shadow-lg" onClick={(e) => e.stopPropagation()} >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Comments</h3>
              <button onClick={handleCloseComments} className="text-sm">Close</button>
            </div>
            
            {/* Comments List */}
            <div className="max-h-[60vh] overflow-auto space-y-2 mb-3">
              {comments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No comments yet.</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="text-sm break-words">
                    <span className="font-medium">
                      {comment.user && typeof comment.user === 'object' 
                        ? (comment.user.display_name || 
                           [comment.user.first_name, comment.user.last_name].filter(Boolean).join(' ') || 
                           comment.user.email || 
                           'Anon')
                        : (comment.user || 'Anon')
                      }
                    </span>: {comment.content}
                  </div>
                ))
              )}
            </div>
            
            {/* Error Message */}
            {commentError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {commentError}
              </div>
            )}
            
            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 border-gray-300 dark:border-neutral-700"
                disabled={commentLoading}
              />
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {commentLoading ? '...' : 'Comment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}

