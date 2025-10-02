'use client';

import { useState, FormEvent } from 'react';

export function CommentComposer({ postId, onPosted }: { postId: string; onPosted?: () => void }) {
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		if (!content.trim()) return;
		setLoading(true);
		try {
			await fetch('/api/comments', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ postId, content }),
			});
			setContent('');
			onPosted?.();
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="flex items-center gap-2">
			<input
				type="text"
				placeholder="Write a comment..."
				value={content}
				onChange={(e) => setContent(e.target.value)}
				className="flex-1 rounded border px-3 py-2 text-sm"
			/>
			<button type="submit" disabled={loading || !content.trim()} className="rounded border px-3 py-2 text-sm">Comment</button>
		</form>
	);
} 