/*
 Seed demo users and friendships in Directus
 Env: DIRECTUS_URL (or NEXT_PUBLIC_DIRECTUS_URL), DIRECTUS_ADMIN_TOKEN
 Usage: npx tsx scripts/seedUsersAndFriendships.ts
*/

import fetch from 'node-fetch';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!DIRECTUS_URL) throw new Error('Missing DIRECTUS_URL or NEXT_PUBLIC_DIRECTUS_URL');
if (!ADMIN_TOKEN) throw new Error('Missing DIRECTUS_ADMIN_TOKEN');

async function api(path: string, init?: RequestInit) {
	const res = await fetch(`${(DIRECTUS_URL as string).replace(/\/$/, '')}${path}`, {
		...init,
		headers: { 'content-type': 'application/json', authorization: `Bearer ${ADMIN_TOKEN}`, ...(init?.headers || {}) },
	});
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
	return res.json();
}

async function upsertUser(email: string, first_name: string, last_name: string, password: string) {
	// find
	const list = await api(`/users?filter[email][_eq]=${encodeURIComponent(email)}&limit=1`);
	if (Array.isArray(list?.data) && list.data.length) {
		const u = list.data[0];
		console.log(`✔ User exists: ${email}`);
		return u.id as string;
	}
	const created = await api(`/users`, { method: 'POST', body: JSON.stringify({ email, first_name, last_name, password }) });
	console.log(`✔ Created user: ${email}`);
	return created.data.id as string;
}

async function ensureFriendship(user_a: string, user_b: string) {
	// normalize ordering
	const [A, B] = String(user_a) < String(user_b) ? [user_a, user_b] : [user_b, user_a];
	const list = await api(`/items/friendships?filter[user_a][_eq]=${A}&filter[user_b][_eq]=${B}&limit=1`);
	if (Array.isArray(list?.data) && list.data.length) {
		console.log(`  • Friendship exists: ${A} <-> ${B}`);
		return list.data[0].id as string;
	}
	const created = await api(`/items/friendships`, { method: 'POST', body: JSON.stringify({ user_a: A, user_b: B, status: 'accepted' }) });
	console.log(`  • Created friendship: ${A} <-> ${B}`);
	return created.data.id as string;
}

async function main() {
	const alice = await upsertUser('alice@example.com', 'Alice', 'Pham', 'Password123!');
	const bob = await upsertUser('bob@example.com', 'Bob', 'Nguyen', 'Password123!');
	const charlie = await upsertUser('charlie@example.com', 'Charlie', 'Tran', 'Password123!');

	await ensureFriendship(alice, bob);
	await ensureFriendship(alice, charlie);
	await ensureFriendship(bob, charlie);

	console.log('Done seeding users and friendships.');
}

main().catch((e) => { console.error(e); process.exit(1); }); 