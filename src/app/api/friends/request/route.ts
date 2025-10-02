import { NextRequest } from 'next/server';
import { useDirectus } from '@/lib/directus/directus';
import { readItems, createItem, updateItem, withToken } from '@directus/sdk';
import { requireUserToken, getCurrentUserId } from '@/lib/auth/server';

function normalizePair(a: string, b: string): [string, string] {
	return String(a) < String(b) ? [a, b] : [b, a];
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const targetId = String(body?.userId || '');
		if (!targetId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers: { 'content-type': 'application/json' } });

		const token = await requireUserToken();
		const me = await getCurrentUserId();
		if (!me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
		if (String(me) === String(targetId)) return new Response(JSON.stringify({ error: 'Cannot friend yourself' }), { status: 400, headers: { 'content-type': 'application/json' } });

		const { directus } = useDirectus();
		const [A, B] = normalizePair(me, targetId);

		// Look up existing friendship
		const existing = (await directus.request(
			withToken(token, readItems('friendships' as any, { fields: ['id', 'user_a', 'user_b', 'status'], filter: { user_a: { _eq: A }, user_b: { _eq: B } }, limit: 1 } as any))
		)) as any[];
		if (existing?.length) {
			const f = existing[0];
			if (f.status === 'pending' && String(targetId) === String(f.user_a)) {
				// reverse pending → accept
				await directus.request(withToken(token, updateItem('friendships' as any, f.id as any, { status: 'accepted' } as any)));
				return new Response(JSON.stringify({ updated: 'accepted' }), { status: 200, headers: { 'content-type': 'application/json' } });
			}
			return new Response(JSON.stringify({ exists: true, status: f.status }), { status: 200, headers: { 'content-type': 'application/json' } });
		}

		// Create pending request (requester is me)
		await directus.request(withToken(token, createItem('friendships' as any, { user_a: A, user_b: B, status: 'pending' } as any)));
		return new Response(JSON.stringify({ created: 'pending' }), { status: 201, headers: { 'content-type': 'application/json' } });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: 'Failed to request', details: e?.message || String(e) }), { status: 500, headers: { 'content-type': 'application/json' } });
	}
} 