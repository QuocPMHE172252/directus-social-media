import { NextRequest } from 'next/server';
import { useDirectus } from '@/lib/directus/directus';
import { readItems, updateItem, deleteItems, withToken } from '@directus/sdk';
import { requireUserToken, getCurrentUserId } from '@/lib/auth/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const postId = params.id;
		const body = await req.json();
		const title = typeof body?.title === 'string' ? body.title : undefined;
		const content = typeof body?.content === 'string' ? body.content : undefined;
		if (!postId) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'content-type': 'application/json' } });

		const token = await requireUserToken();
		const userId = await getCurrentUserId();
		if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

		const { directus } = useDirectus();
		// Verify ownership
		const items = (await directus.request(
			withToken(token, readItems('posts' as any, { fields: ['id', 'user_created'], filter: { id: { _eq: postId } }, limit: 1 } as any))
		)) as any[];
		if (!Array.isArray(items) || items.length === 0) {
			return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
		}
		if (String(items[0].user_created) !== String(userId)) {
			return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } });
		}

		const payload: any = {};
		if (title !== undefined) payload.title = title;
		if (content !== undefined) payload.description = content;

		const updated = await directus.request(withToken(token, updateItem('posts' as any, postId as any, payload as any)));
		return new Response(JSON.stringify({ success: true, post: updated }), { status: 200, headers: { 'content-type': 'application/json' } });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: 'Failed to update post', details: e?.message || String(e) }), { status: 500, headers: { 'content-type': 'application/json' } });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const postId = params.id;
		if (!postId) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'content-type': 'application/json' } });
		const token = await requireUserToken();
		const userId = await getCurrentUserId();
		if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

		const { directus } = useDirectus();
		// Verify ownership
		const items = (await directus.request(
			withToken(token, readItems('posts' as any, { fields: ['id', 'user_created'], filter: { id: { _eq: postId } }, limit: 1 } as any))
		)) as any[];
		if (!Array.isArray(items) || items.length === 0) {
			return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
		}
		if (String(items[0].user_created) !== String(userId)) {
			return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } });
		}

		await directus.request(withToken(token, deleteItems('posts' as any, [postId] as any)));
		return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'content-type': 'application/json' } });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: 'Failed to delete post', details: e?.message || String(e) }), { status: 500, headers: { 'content-type': 'application/json' } });
	}
} 