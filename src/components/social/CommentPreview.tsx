async function getLatest(postId: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/comments?postId=${encodeURIComponent(postId)}&page=1&pageSize=2`, { cache: 'no-store' });
	if (!res.ok) return [] as any[];
	return res.json();
}

export default async function CommentPreview({ postId }: { postId: string }) {
	const items = await getLatest(postId);
	return (
		<div className="space-y-2">
			{items.length === 0 ? (
				<div className="text-sm text-muted-foreground">No comments yet.</div>
			) : (
				items.map((c: any) => (
					<div key={c.id} className="text-sm">
						<span className="font-medium">{c.user ?? 'Anon'}</span>: {c.content}
					</div>
				))
			)}
		</div>
	);
} 