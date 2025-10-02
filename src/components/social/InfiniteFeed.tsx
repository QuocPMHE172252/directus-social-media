"use client";

import { useState, useEffect, useRef } from 'react';
import { PostCard } from '@/components/social/PostCard';
import { PostComposer } from '@/components/social/PostComposer';
import { FeedPost } from '@/lib/social/fetchers';
import { FeedSkeleton } from '@/components/social/FeedSkeleton';

export function InfiniteFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadPosts = async (pageNum: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/feed?page=${pageNum}&pageSize=3`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data = await response.json();
      const newPosts = data.items || [];
      
      if (reset) {
        setPosts(newPosts);
      } else {
        // Tránh duplicate posts bằng cách filter
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter((post: any) => !existingIds.has(post.id));
          return [...prev, ...uniqueNewPosts];
        });
      }
      
      setHasMore(newPosts.length === 3);
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial posts
    loadPosts(1, true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts(page);
        }
      },
      { threshold: 0.1 }
    );

    const target = observerRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [page, hasMore, loading]);

  return (
    <div className="mx-auto w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Feed</h1>
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <PostComposer />
        {posts.length === 0 && loading && (
          <div className="rounded-md border p-3 sm:p-4">
            <FeedSkeleton />
          </div>
        )}
        {posts.length === 0 && !loading ? (
          <div className="rounded-md border p-3 sm:p-4 text-sm text-muted-foreground">
            No posts yet.
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="transition-shadow duration-200 hover:shadow-md">
              <PostCard post={post} />
            </div>
          ))
        )}
        {loading && posts.length > 0 && (
          <div className="rounded-md border p-3 sm:p-4">
            <FeedSkeleton />
          </div>
        )}
        <div ref={observerRef} className="h-4" />
      </div>
    </div>
  );
}
