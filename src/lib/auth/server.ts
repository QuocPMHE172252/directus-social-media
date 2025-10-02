import { cookies } from 'next/headers';
import { useDirectus } from '@/lib/directus/directus';
import { readUser, withToken } from '@directus/sdk';

export async function getUserTokenFromCookie(): Promise<string | null> {
	const store = cookies();
	const c = store.get('dx_token');

	return c?.value || null;
}

export async function getCurrentUserId(): Promise<string | null> {
	const token = await getUserTokenFromCookie();
	if (!token) {
		return null;
	}
	const { directus } = useDirectus();
	try {
		const me = await directus.request(withToken(token, readUser('me' as any)) as any);

		return (me as any)?.id ? String((me as any).id) : null;
	} catch {
		return null;
	}
}

export async function requireUserToken(): Promise<string> {
	const token = await getUserTokenFromCookie();
	if (!token) throw new Error('UNAUTHORIZED');

	return token;
}


