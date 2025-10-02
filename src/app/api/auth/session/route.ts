import { getCurrentUserId } from '@/lib/auth/server';
import { useDirectus } from '@/lib/directus/directus';
import { readUser, withToken } from '@directus/sdk';

export async function GET() {
	const userId = await getCurrentUserId();
	if (!userId) return new Response(JSON.stringify({ user: null }), { status: 200, headers: { 'content-type': 'application/json' } });
	const { directus } = useDirectus();
	return new Response(
		JSON.stringify({ user: { id: userId } }),
		{ status: 200, headers: { 'content-type': 'application/json' } },
	);
} 