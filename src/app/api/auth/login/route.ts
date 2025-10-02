import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const email = String(body?.email || '');
		const password = String(body?.password || '');
		if (!email || !password) return new Response('Missing email/password', { status: 400 });

		const base = process.env.NEXT_PUBLIC_DIRECTUS_URL!;
		const res = await fetch(`${base.replace(/\/$/, '')}/auth/login`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ email, password }),
			cache: 'no-store',
		});
		if (!res.ok) return new Response(await res.text(), { status: res.status });
		const data = await res.json();
		const token = data?.data?.access_token;
		if (!token) return new Response('No token', { status: 500 });

		cookies().set('dx_token', token, { httpOnly: true, sameSite: 'lax', path: '/', secure: false });
		return new Response(null, { status: 204 });
	} catch (e) {
		return new Response('Login failed', { status: 500 });
	}
} 