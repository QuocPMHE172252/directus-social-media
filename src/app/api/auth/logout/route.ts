import { cookies } from 'next/headers';

export async function POST() {
	cookies().set('dx_token', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
	return new Response(null, { status: 204 });
} 