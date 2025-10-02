import { useDirectus } from '@/lib/directus/directus';
import { readItems, readItem, createItem, withToken } from '@directus/sdk';

export type FeedPost = {
	id: string;
	authorId?: string;
	authorName?: string;
	authorAvatar?: string | null;
	title?: string | null;
	content?: string | null;
	image?: string | null;
	slug?: string | null;
	createdAt?: string | null;
	reactionSummary?: Record<string, number>;
	commentsCount?: number;
};

export async function fetchFeed(params: { page?: number; pageSize?: number } = {}) {
	console.log('fetchFeed called with params:', params);
	const { directus } = useDirectus();
	const publicToken = process.env.DIRECTUS_PUBLIC_TOKEN;
	const page = params.page ?? 1;
	const pageSize = params.pageSize ?? 10;

	console.log('Fetching posts from Directus...');
	const items = (await (directus as any).request(
		readItems('posts' as any, {
			fields: [
				'id',
				'title',
				'description',
				'slug',
				'image',
				'status',
				'published_at',
				{ user_created: ['id', 'first_name', 'last_name', 'avatar'] },
			],
			filter: { status: { _eq: 'published' } },
			sort: ['-published_at'],
			limit: pageSize,
			page,
		} as any),
	)) as any[];

	console.log('Posts fetched:', items.length);

	// Build list of post ids
	const postIds: string[] = (items || []).map((p: any) => String(p.id));

	// Batch count comments for all posts using aggregate groupBy on `post`
	const countByPost: Record<string, number> = {};
	if (postIds.length > 0) {
		try {
			const req = readItems('comments' as any, {
				fields: ['count'],
				aggregate: { count: '*' } as any,
				groupBy: ['post'] as any,
				filter: { post: { _in: postIds } } as any,
				limit: -1,
			} as any);
			const res = await (directus as any).request(publicToken ? (withToken(publicToken as any, req as any) as any) : (req as any));
			(res || []).forEach((row: any) => {
				const key = String(row.post);
				const cnt = Number((row?.count && (Array.isArray(row.count) ? row.count[0] : row.count)) ?? 0);
				countByPost[key] = (countByPost[key] || 0) + (Number.isFinite(cnt) ? cnt : 0);
			});
		} catch (e) {
			console.warn('Aggregate by post failed:', e);
		}
	}

	const mapped: FeedPost[] = (items || []).map((p: any) => {
		const u = p.user_created || null;
		const authorId = u && u.id ? String(u.id) : undefined;
		const fullName = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : '';
		const authorName = fullName || (p.user_created ? 'User' : 'Anonymous');
		const authorAvatar = u && u.avatar ? String(u.avatar) : null;

		return {
			id: String(p.id),
			title: p.title ?? null,
			content: p.description ?? null,
			image: p.image ?? null,
			slug: p.slug ?? null,
			createdAt: p.published_at ?? null,
			authorId,
			authorName,
			authorAvatar,
			commentsCount: countByPost[String(p.id)] || 0,
		};
	});

	console.log('Final mapped posts:', mapped.map(p => ({ id: p.id, commentsCount: p.commentsCount })));

	const nextPage = mapped.length < pageSize ? null : page + 1;
	
	return { items: mapped, nextPage };
}

export async function fetchUserProfile(usernameOrId: string) {
	return { id: usernameOrId, displayName: usernameOrId } as const;
}

export async function fetchPostById(id: string) {
	const { directus } = useDirectus();
	const publicToken = process.env.DIRECTUS_PUBLIC_TOKEN;
	const p = (await (directus as any).request(
		readItem('posts' as any, id as any, {
			fields: [
				'id',
				'title',
				'description',
				'slug',
				'image',
				'status',
				'published_at',
				{ user_created: ['id', 'first_name', 'last_name', 'avatar'] },
			],
		} as any),
	)) as any;
	
	// Lấy số comment cho post này
	let commentsCount = 0;
	try {
		const request = readItems('comments' as any, {
			fields: ['id'],
			filter: { post: { _eq: id } } as any,
		} as any);
		const comments = await (directus as any).request(publicToken ? (withToken(publicToken as any, request as any) as any) : (request as any));
		commentsCount = Array.isArray(comments) ? comments.length : 0;
	} catch (error) {
		console.error('Error fetching comments for post', id, error);
	}
	
	const u = p.user_created || null;
	const authorId = u && u.id ? String(u.id) : undefined;
	const fullName = u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : '';
	const authorName = fullName || 'User';
	const authorAvatar = u && u.avatar ? String(u.avatar) : null;

	return {
		id: String(p.id),
		title: p.title ?? null,
		content: p.description ?? null,
		image: p.image ?? null,
		slug: p.slug ?? null,
		createdAt: p.published_at ?? null,
		authorId,
		authorName,
		authorAvatar,
		commentsCount,
	} as FeedPost;
}

export type CommentItem = { id: string; userId?: string | null; content: string; createdAt: string };

export async function fetchComments(postId: string, params: { page?: number; pageSize?: number } = {}) {
	const { directus } = useDirectus();
	const publicToken = process.env.DIRECTUS_PUBLIC_TOKEN;
	const page = params.page ?? 1;
	const pageSize = params.pageSize ?? 10;

	const request = readItems('comments' as any, {
		fields: ['id', 'user', 'content', 'created_at'],
		filter: { post: { _eq: postId } } as any,
		sort: ['-created_at'],
		limit: pageSize,
		page,
	} as any);
	const items = (await (directus as any).request(publicToken ? (withToken(publicToken as any, request as any) as any) : (request as any))) as any[];

	const mapped: CommentItem[] = (items || []).map((c: any) => ({
		id: String(c.id),
		userId: c.user ? String(c.user) : null,
		content: c.content ?? '',
		createdAt: c.created_at ?? '',
	}));

	const nextPage = mapped.length < pageSize ? null : page + 1;
	
	return { items: mapped, nextPage };
}

export async function createComment(postId: string, content: string) {
	const { directus } = useDirectus();
	const created = await (directus as any).request(
		createItem('comments' as any, { post: postId, content } as any),
	);
	return { id: (created as any)?.id } as const;
}

export async function fetchReactionSummary(postId: string) {
	const { directus } = useDirectus();
	const items = (await (directus as any).request(
		readItems('reactions' as any, {
			fields: ['type'],
			filter: { post: { _eq: postId } },
		} as any),
	)) as any[];

	const summary: Record<string, number> = {};
	(items || []).forEach((r: any) => {
		const type = r.type || 'like';
		summary[type] = (summary[type] || 0) + 1;
	});

	return summary;
}