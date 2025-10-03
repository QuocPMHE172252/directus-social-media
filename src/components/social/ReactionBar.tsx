"use client";

import { useState, useEffect, useRef } from 'react';

export function ReactionBar({ postId, compact = false }: { postId: string; compact?: boolean }) {
	const [summary, setSummary] = useState<Record<string, number>>({});
	const [loading, setLoading] = useState(false);
	const [lastAction, setLastAction] = useState<string | null>(null);
	const [likedFlash, setLikedFlash] = useState(false);
	const [liked, setLiked] = useState(false);
	const lastInteractAtRef = useRef<number>(0);

	function getCount(type: string) {
		return summary[type] ?? 0;
	}

	async function refresh() {
		try {
			console.log('[ReactionBar] refresh start', { postId });
			const res = await fetch(`/api/reactions?postId=${encodeURIComponent(postId)}`, { cache: 'no-store' });
			console.log('[ReactionBar] refresh response', res.status);
			if (res.ok) {
				const data = await res.json();
				console.log('[ReactionBar] refresh data', data);
				// Há»— trá»£ cáº£ 2 dáº¡ng: { summary, hasLiked } hoáº·c summary thuáº§n
				if (data && data.summary) {
					setSummary(data.summary);
					if (typeof data.hasLiked === 'boolean') {
						const now = Date.now();
						if (now - lastInteractAtRef.current > 800) {
							setLiked(data.hasLiked);
						}
					}
				} else {
					setSummary(data || {});
				}
			}
		} catch (err) {
			console.error('[ReactionBar] refresh error', err);
		}
	}

	useEffect(() => {
		console.log('[ReactionBar] mount', { postId });
		refresh();
	}, [postId]);

	useEffect(() => {
		console.log('[ReactionBar] render state', { postId, loading, liked, summary });
	});

	async function react(type: string) {
		if (loading) return;
		console.log('[ReactionBar] react start', { postId, type });
		setLoading(true);
		setLastAction(null);
		const wasLiked = liked;
		lastInteractAtRef.current = Date.now();

		// Optimistic toggle
		if (wasLiked) {
			setSummary(prev => ({ ...prev, [type]: Math.max((prev[type] ?? 1) - 1, 0) }));
			setLiked(false);
		} else {
			setSummary(prev => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }));
			setLiked(true);
		}
		setLikedFlash(true);
		setTimeout(() => setLikedFlash(false), 300);

		try {
			const response = await fetch('/api/reactions', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ postId, type }),
			});
			console.log('[ReactionBar] react response', response.status);
			const data = await response.json().catch(() => null);
			console.log('[ReactionBar] react data', data);
			if (response.ok) {
				if (data && data.toggled === 'like') setLiked(true);
				if (data && data.toggled === 'unlike') setLiked(false);
				await refresh();
			} else if (response.status === 401) {
				// revert
				setSummary(prev => ({ ...prev, [type]: Math.max((prev[type] ?? 0) + (wasLiked ? 1 : -1), 0) }));
				setLiked(wasLiked);
				setLastAction(`âŒ Please login to like posts`);
				setTimeout(() => { window.location.href = '/login'; }, 1200);
			} else {
				// revert
				setSummary(prev => ({ ...prev, [type]: Math.max((prev[type] ?? 0) + (wasLiked ? 1 : -1), 0) }));
				setLiked(wasLiked);
				setLastAction(`âŒ Failed: ${(data && (data.message || data.error)) || 'Unknown error'}`);
			}
		} catch (error) {
			// revert
			console.error('[ReactionBar] react error', error);
			setSummary(prev => ({ ...prev, [type]: Math.max((prev[type] ?? 0) + (wasLiked ? 1 : -1), 0) }));
			setLiked(wasLiked);
			setLastAction(`âŒ Error: ${error}`);
		} finally {
			setLoading(false);
		}
	}

	const likeCount = getCount('like');
	const likedColor = liked || likedFlash ? 'text-blue-600' : 'text-gray-500';
	const likedBg = liked || likedFlash ? 'bg-blue-50' : '';

	if (compact) {
		return (
			<div className="flex items-center justify-center gap-2">
				<button
					onClick={() => { console.log('[ReactionBar] like clicked (compact)'); react('like'); }}
					disabled={loading}
					className={`flex items-center space-x-2 px-4 py-2 rounded-lg justify-center transition-transform ${loading ? 'opacity-50' : 'hover:bg-gray-50'} ${likedBg} ${likedFlash ? 'scale-95' : ''}`}
				>
					<svg className={`size-5 ${likedColor}`} fill="currentColor" viewBox="0 0 20 20">
						<path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.734a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
					</svg>
					<span className={`font-medium ${liked ? 'text-blue-700' : 'text-gray-600'}`}>Like</span>
				</button>
				{likeCount > 0 && (
					<span className="text-xs text-blue-600 font-medium min-w-[1.5rem] text-center">{likeCount}</span>
				)}
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 text-sm">
			<button 
				onClick={() => { console.log('[ReactionBar] like clicked'); react('like'); }} 
				disabled={loading} 
				className={`rounded border px-3 py-1 transition-transform ${loading ? 'opacity-50' : 'hover:bg-gray-100'} ${likedFlash ? 'scale-95 border-blue-300' : ''} ${liked ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}`}
			>
				{loading ? '...' : 'ðŸ‘ Like'}
			</button>
			{likeCount > 0 && (
				<span className="text-blue-600 font-medium">{`like: ${likeCount}`}</span>
			)}
			{lastAction && (
				<span className={`text-xs ${lastAction.includes('âœ…') ? 'text-green-600' : 'text-red-600'}`}>
					{lastAction}
				</span>
			)}
		</div>
	);
} 

