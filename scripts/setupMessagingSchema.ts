/*
 Directus schema setup for Messaging (DM) + Friendships
 Env required: DIRECTUS_URL (or NEXT_PUBLIC_DIRECTUS_URL), DIRECTUS_ADMIN_TOKEN (static admin token)
 Usage: npx tsx scripts/setupMessagingSchema.ts
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
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
	return res.json();
}

async function ensureCollection(collection: string, payload: any) {
	try { await api(`/collections/${collection}`); console.log(`✔ Collection exists: ${collection}`); }
	catch { await api(`/collections`, { method: 'POST', body: JSON.stringify(payload) }); console.log(`✔ Created collection: ${collection}`); }
}

async function ensureField(collection: string, field: string, payload: any) {
	try { await api(`/fields/${collection}/${field}`); console.log(`  • Field exists: ${collection}.${field}`); }
	catch { await api(`/fields/${collection}`, { method: 'POST', body: JSON.stringify(payload) }); console.log(`  • Created field: ${collection}.${field}`); }
}

async function ensureRelation(collection: string, field: string, related_collection: string) {
	const q = `filter[collection][_eq]=${collection}&filter[field][_eq]=${field}&filter[related_collection][_eq]=${related_collection}`;
	const list = await api(`/relations?${q}`).catch(() => ({ data: [] as any[] })) as any;
	if (Array.isArray(list?.data) && list.data.length > 0) { console.log(`  • Relation exists: ${collection}.${field} → ${related_collection}`); return; }
	await api(`/relations`, { method: 'POST', body: JSON.stringify({ collection, field, related_collection, meta: { many_field: null, one_allowed_collections: null }, schema: { on_delete: 'SET NULL' } }) });
	console.log(`  • Created relation: ${collection}.${field} → ${related_collection}`);
}

async function main() {
	// conversations
	await ensureCollection('conversations', { collection: 'conversations', schema: { name: 'conversations' }, meta: { icon: 'forum' } });
	await ensureField('conversations', 'id', { field: 'id', type: 'uuid', schema: { is_primary_key: true, is_nullable: false, default_value: 'uuid_generate_v4()' } });
	await ensureField('conversations', 'last_message_at', { field: 'last_message_at', type: 'timestamp', schema: { is_nullable: true } });

	// conversation_participants
	await ensureCollection('conversation_participants', { collection: 'conversation_participants', schema: { name: 'conversation_participants' }, meta: { icon: 'group' } });
	await ensureField('conversation_participants', 'id', { field: 'id', type: 'uuid', schema: { is_primary_key: true, is_nullable: false, default_value: 'uuid_generate_v4()' } });
	await ensureField('conversation_participants', 'conversation', { field: 'conversation', type: 'uuid', schema: { is_nullable: false } });
	await ensureField('conversation_participants', 'user', { field: 'user', type: 'uuid', schema: { is_nullable: false } });
	await ensureField('conversation_participants', 'joined_at', { field: 'joined_at', type: 'timestamp', schema: { is_nullable: true } });
	await ensureField('conversation_participants', 'last_read_at', { field: 'last_read_at', type: 'timestamp', schema: { is_nullable: true } });

	// messages
	await ensureCollection('messages', { collection: 'messages', schema: { name: 'messages' }, meta: { icon: 'chat' } });
	await ensureField('messages', 'id', { field: 'id', type: 'uuid', schema: { is_primary_key: true, is_nullable: false, default_value: 'uuid_generate_v4()' } });
	await ensureField('messages', 'conversation', { field: 'conversation', type: 'uuid', schema: { is_nullable: false } });
	await ensureField('messages', 'sender', { field: 'sender', type: 'uuid', schema: { is_nullable: false } });
	await ensureField('messages', 'content', { field: 'content', type: 'text', schema: { is_nullable: false } });
	await ensureField('messages', 'created_at', { field: 'created_at', type: 'timestamp', schema: { is_nullable: false, default_value: 'now()' } });

	// Relations for messaging
	await ensureRelation('conversation_participants', 'conversation', 'conversations');
	await ensureRelation('conversation_participants', 'user', 'directus_users');
	await ensureRelation('messages', 'conversation', 'conversations');
	await ensureRelation('messages', 'sender', 'directus_users');

	// friendships
	await ensureCollection('friendships', { collection: 'friendships', schema: { name: 'friendships' }, meta: { icon: 'people' } });
	await ensureField('friendships', 'id', { field: 'id', type: 'uuid', schema: { is_primary_key: true, is_nullable: false, default_value: 'uuid_generate_v4()' } });
	await ensureField('friendships', 'user_a', { field: 'user_a', type: 'uuid', schema: { is_nullable: false } });
	await ensureField('friendships', 'user_b', { field: 'user_b', type: 'uuid', schema: { is_nullable: false } });
	await ensureField('friendships', 'status', { field: 'status', type: 'string', schema: { is_nullable: false, default_value: 'pending' }, meta: { options: { choices: [ { text: 'pending', value: 'pending' }, { text: 'accepted', value: 'accepted' }, { text: 'blocked', value: 'blocked' } ] } } });
	await ensureField('friendships', 'created_at', { field: 'created_at', type: 'timestamp', schema: { is_nullable: false, default_value: 'now()' } });

	await ensureRelation('friendships', 'user_a', 'directus_users');
	await ensureRelation('friendships', 'user_b', 'directus_users');

	console.log('✔ Messaging & Friendships: collections, fields, relations ensured.');
	console.log('Note: Add a unique constraint (user_a,user_b) manually in DB or via Directus UI to prevent duplicates.');
}

main().catch((e) => { console.error(e); process.exit(1); }); 