import { fetchComments } from '@/lib/social/fetchers';
import { CommentComposer } from '@/components/social/CommentComposer';

export default async function CommentList({ postId }: { postId: string }) {
	const { items } = await fetchComments(postId, { page: 1, pageSize: 10 });
	return (
		<div className="space-y-3">
			<div className="space-y-2">
				{items.length === 0 ? (
					<div className="text-sm text-muted-foreground">No comments yet.</div>
				) : (
					items.map((c) => (
						<div key={c.id} className="text-sm">
							<span className="font-medium">{c.userId ?? 'Anon'}</span>: {c.content}
							<div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
						</div>
					))
				)}
			</div>
			<CommentComposer postId={postId} />
		</div>
	);
} 