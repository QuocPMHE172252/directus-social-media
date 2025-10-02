"use client";

import { useEffect, useState } from 'react';
import { CommentComposer } from '@/components/social/CommentComposer';

export function CommentsModal({ postId, triggerLabel = 'View comments', onCommentAdded }: { 
  postId: string; 
  triggerLabel?: string;
  onCommentAdded?: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState<any[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const pageSize = 10;

	async function load(reset = false) {
		const p = reset ? 1 : page;
		const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}&page=${p}&pageSize=${pageSize}`, { cache: 'no-store' });
		if (!res.ok) return;
		const data = await res.json();
		setItems((prev) => (reset ? data : [...prev, ...data]));
		setHasMore(data.length === pageSize);
		setPage(p + 1);
	}

	useEffect(() => {
		if (!open) return;
		load(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') setOpen(false);
		}
		if (open) {
			window.addEventListener('keydown', onKey);
			return () => window.removeEventListener('keydown', onKey);
		}
	}, [open]);

	const handleCommentPosted = () => {
		load(true); // Refresh comments in modal
		onCommentAdded?.(); // Notify parent component to refresh comment count
	};

	return (
		<div>
			<button className="text-sm underline" onClick={() => setOpen(true)}>{triggerLabel}</button>
			{open ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
					<div className="w-full max-w-xl rounded-md bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-base font-semibold">Comments</h3>
							<button onClick={() => setOpen(false)} className="text-sm">Close</button>
						</div>
						<div className="max-h-[60vh] overflow-auto space-y-2 mb-3">
							{items.length === 0 ? (
								<div className="text-sm text-muted-foreground">No comments yet.</div>
							) : (
								items.map((c) => (
									<div key={c.id} className="text-sm">
										<span className="font-medium">{c.user ?? 'Anon'}</span>: {c.content}
									</div>
								))
							)}
						</div>
						{hasMore ? (
							<button onClick={() => load(false)} className="text-sm underline">Load more</button>
						) : null}
						<div className="mt-3">
							<CommentComposer postId={postId} onPosted={handleCommentPosted} />
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}