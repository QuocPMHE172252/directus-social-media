/*
 Minimal Directus schema setup for social features.
 Requirements:
 - Set env vars: DIRECTUS_URL (e.g. http://localhost:8055), DIRECTUS_ADMIN_TOKEN (admin static token)
 Usage:
 - npx tsx scripts/setupSocialSchema.ts
*/

import fetch from 'node-fetch';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!DIRECTUS_URL) throw new Error('Missing DIRECTUS_URL or NEXT_PUBLIC_DIRECTUS_URL');
if (!ADMIN_TOKEN) throw new Error('Missing DIRECTUS_ADMIN_TOKEN');

async function api(path: string, init?: RequestInit) {
	const url = `${DIRECTUS_URL!.replace(/\/$/, '')}${path}`;
	const res = await fetch(url, {
		...init,
		headers: {
			'content-type': 'application/json',
			'authorization': `Bearer ${ADMIN_TOKEN}`,
			...(init?.headers || {}),
		},
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`${res.status} ${res.statusText}: ${text}`);
	}
	return res.json();
}

async function ensureCollection(collection: string, payload: any) {
	try {
		await api(`/collections/${collection}`);
		console.log(`✔ Collection exists: ${collection}`);
	} catch {
		await api(`/collections`, { method: 'POST', body: JSON.stringify(payload) });
		console.log(`✔ Created collection: ${collection}`);
	}
}

async function ensureField(collection: string, field: string, payload: any) {
	try {
		await api(`/fields/${collection}/${field}`);
		console.log(`  • Field exists: ${collection}.${field}`);
	} catch {
		await api(`/fields/${collection}`, { method: 'POST', body: JSON.stringify(payload) });
		console.log(`  • Created field: ${collection}.${field}`);
	}
}

async function main() {
	// comments
	await ensureCollection('comments', {
		collection: 'comments',
		schema: { name: 'comments' },
		meta: { icon: 'chat', note: 'Post comments' },
	});
	await ensureField('comments', 'id', { field: 'id', type: 'uuid', schema: { is_primary_key: true, is_nullable: false, default_value: 'uuid_generate_v4()' } });
	await ensureField('comments', 'post', { field: 'post', type: 'uuid', schema: { is_nullable: false } });
	await ensureField('comments', 'user', { field: 'user', type: 'uuid', schema: { is_nullable: true } });
	await ensureField('comments', 'content', { field: 'content', type: 'text', schema: { is_nullable: false } });
	await ensureField('comments', 'created_at', { field: 'created_at', type: 'timestamp', schema: { is_nullable: false, default_value: 'now()' } });

	// reactions
	await ensureCollection('reactions', {
		collection: 'reactions',
		schema: { name: 'reactions' },
		meta: { icon: 'favorite', note: 'Post reactions' },
	});
	await ensureField('reactions', 'id', { field: 'id', type: 'uuid', schema: { is_primary_key: true, is_nullable: false, default_value: 'uuid_generate_v4()' } });
	await ensureField('reactions', 'post', { field: 'post', type: 'uuid', schema: { is_nullable: false } });
	await ensureField('reactions', 'user', { field: 'user', type: 'uuid', schema: { is_nullable: true } });
	await ensureField('reactions', 'type', { field: 'type', type: 'string', schema: { is_nullable: false } });
	await ensureField('reactions', 'created_at', { field: 'created_at', type: 'timestamp', schema: { is_nullable: false, default_value: 'now()' } });

	console.log('Done. You can now adjust relations and permissions in Directus UI.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
