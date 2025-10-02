import { NextRequest } from 'next/server';
import { useDirectus } from '@/lib/directus/directus';
import { readItems, readUser, withToken } from '@directus/sdk';
import { getCurrentUserId, requireUserToken } from '@/lib/auth/server';

export async function GET(_req: NextRequest) {
	const { directus } = useDirectus();
	const publicToken = process.env.DIRECTUS_PUBLIC_TOKEN;
	try {
		let me: string | null = null;
		try { me = await getCurrentUserId(); } catch {}
		if (publicToken) {
			const users = (await directus.request(
				withToken(publicToken, readItems('directus_users' as any, { fields: ['id','first_name','last_name','email'], limit: 50 } as any))
			)) as any[];
			return new Response(JSON.stringify((users||[]).filter(u => !me || String(u.id) !== String(me))), { status: 200, headers: { 'content-type': 'application/json' } });
		}
		const token = await requireUserToken();
		const users = (await directus.request(
			withToken(token, readItems('directus_users' as any, { fields: ['id','first_name','last_name','email'], limit: 50 } as any))
		)) as any[];
		return new Response(JSON.stringify((users||[]).filter(u => !me || String(u.id) !== String(me))), { status: 200, headers: { 'content-type': 'application/json' } });
	} catch (e: any) {
		return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
	}
} 