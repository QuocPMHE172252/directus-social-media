import { NextRequest } from 'next/server';
import { useDirectus } from '@/lib/directus/directus';
import { readItems, createItem, withToken, deleteItems } from '@directus/sdk';
import { requireUserToken, getCurrentUserId } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const postId = searchParams.get('postId');
	if (!postId) return new Response('Missing postId', { status: 400 });
	
	const { directus } = useDirectus();
	try {
		console.log('Fetching reactions for post:', postId);
		const items = (await directus.request(
			readItems('reactions' as any, { 
				fields: ['type'], 
				filter: { post: { _eq: postId } }, 
				limit: -1 
			} as any),
		)) as any[];
		
		const summary: Record<string, number> = {};
		for (const r of items || []) {
			summary[r.type ?? 'like'] = (summary[r.type ?? 'like'] || 0) + 1;
		}

		// Try detect if current user has liked (best-effort)
		let hasLiked = false;
		try {
			const token = requireUserToken();
			const userId = await getCurrentUserId();
			if (userId) {
				const mine = (await directus.request(
					withToken(token, readItems('reactions' as any, {
						fields: ['id'],
						filter: { post: { _eq: postId }, user: { _eq: userId }, type: { _eq: 'like' } },
						limit: 1
					} as any)),
				)) as any[];
				hasLiked = Array.isArray(mine) && mine.length > 0;
			}
		} catch (e) {
			// ignore auth detection failures
		}
		
		return new Response(JSON.stringify({ summary, hasLiked }), { 
			status: 200, 
			headers: { 'content-type': 'application/json' } 
		});
	} catch (e) {
		console.error('Error fetching reactions:', e);
		return new Response(JSON.stringify({ summary: {}, hasLiked: false }), { 
			status: 200, 
			headers: { 'content-type': 'application/json' } 
		});
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const postId = String(body?.postId || '');
		const type = String(body?.type || 'like');
		
		console.log('Toggle reaction:', { postId, type });
		
		if (!postId) {
			return new Response(JSON.stringify({ error: 'Missing postId' }), { 
				status: 400, 
				headers: { 'content-type': 'application/json' } 
			});
		}
		
		const { directus } = useDirectus();
		
		// Kiểm tra authentication - thử lấy token trước
		let token, userId;
		try {
			token = await requireUserToken();
			userId = await getCurrentUserId();
			console.log('User authenticated:', userId);
		} catch (authError) {
			console.log('Authentication failed:', authError);
			return new Response(JSON.stringify({ 
				error: 'Authentication required', 
				message: 'Please login to like posts',
				redirect: '/login' 
			}), { 
				status: 401, 
				headers: { 'content-type': 'application/json' } 
			});
		}
		
		if (!userId) {
			return new Response(JSON.stringify({ 
				error: 'User not found', 
				message: 'Please login to like posts',
				redirect: '/login' 
			}), { 
				status: 401, 
				headers: { 'content-type': 'application/json' } 
			});
		}

		console.log('Toggling reaction with user:', userId);

		// Kiểm tra đã like chưa - sửa casting
		const existing = (await (directus as any).request(
			(withToken as any)(token, readItems('reactions' as any, {
				fields: ['id'],
				filter: { post: { _eq: postId }, user: { _eq: userId }, type: { _eq: type } },
				limit: 1
			} as any))
		)) as any[];

		if (Array.isArray(existing) && existing.length > 0) {
			// Unlike: xoá reaction hiện có
			console.log('Existing reaction found. Deleting for unlike...');
			await (directus as any).request(
				(withToken as any)(token, deleteItems('reactions' as any, existing.map((e: any) => e.id) as any)),
			);
			return new Response(JSON.stringify({ success: true, toggled: 'unlike' }), { 
				status: 200, 
				headers: { 'content-type': 'application/json' } 
			});
		}

		// Like: tạo bản ghi mới
		console.log('No existing reaction. Creating like...');
		const created = await (directus as any).request(
			(withToken as any)(token, createItem('reactions' as any, { 
				post: postId, 
				user: userId, 
				type: type 
			} as any))
		);
		
		console.log('Reaction created successfully:', created);
		return new Response(JSON.stringify({ success: true, toggled: 'like', id: created }), { 
			status: 200, 
			headers: { 'content-type': 'application/json' } 
		});
	} catch (e: any) {
		console.error('Reaction API error:', e);
		return new Response(JSON.stringify({ 
			error: 'Failed to react', 
			details: e.message 
		}), { 
			status: 500, 
			headers: { 'content-type': 'application/json' } 
		});
	}
} 