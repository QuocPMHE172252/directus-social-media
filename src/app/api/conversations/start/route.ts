import { NextRequest } from 'next/server';
import { useDirectus } from '@/lib/directus/directus';
import { readItems, createItem, withToken } from '@directus/sdk';
import { requireUserToken, getCurrentUserId } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const otherUserId = String(body?.userId || '');
		if (!otherUserId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers: { 'content-type': 'application/json' } });

		const token = await requireUserToken();
		const me = await getCurrentUserId();
		if (!me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

		const { directus } = useDirectus();

		// Find my conversations
		const myParts = (await directus.request(
			withToken(token, readItems('conversation_participants' as any, { fields: ['conversation'], filter: { user: { _eq: me } }, limit: -1 } as any))
		)) as any[];
		const myConvIds = Array.from(new Set((myParts || []).map((p: any) => p.conversation))).filter(Boolean);

		// Check if any contains the other user
		for (const convId of myConvIds) {
			const others = (await directus.request(
				withToken(token, readItems('conversation_participants' as any, { fields: ['user'], filter: { conversation: { _eq: convId }, user: { _eq: otherUserId } }, limit: 1 } as any))
			)) as any[];
			if (Array.isArray(others) && others.length > 0) {
				return new Response(JSON.stringify({ conversationId: convId, created: false }), { status: 200, headers: { 'content-type': 'application/json' } });
			}
		}

		// Create new conversation + participants
		const conversationId = await directus.request(withToken(token, createItem('conversations' as any, { last_message_at: null } as any)));
		await directus.request(withToken(token, createItem('conversation_participants' as any, { conversation: conversationId, user: me } as any)));
		await directus.request(withToken(token, createItem('conversation_participants' as any, { conversation: conversationId, user: otherUserId } as any)));

		return new Response(JSON.stringify({ conversationId, created: true }), { status: 200, headers: { 'content-type': 'application/json' } });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: 'Failed to start conversation', details: e?.message || String(e) }), { status: 500, headers: { 'content-type': 'application/json' } });
	}
} 