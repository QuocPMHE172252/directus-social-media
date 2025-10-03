"use client";

import { useEffect, useState } from 'react';

type FriendUser = { id: string; first_name?: string; last_name?: string; email?: string };

export function FriendsSidebar() {
	const [users, setUsers] = useState<FriendUser[]>([]);
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [statusById, setStatusById] = useState<Record<string, string>>({});

	async function load() {
		try {
			const res = await fetch('/api/friends/list', { cache: 'no-store' });
			const data = await res.json();
			setUsers(data || []);
		} catch {
			// ignore load error
		}
	}

	useEffect(() => { load(); }, []);

	function displayName(u: FriendUser) {
		const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
		return name || u.email || u.id.slice(0, 6);
	}

	function openChat(userId: string) {
		try { (window as any).__openChat?.(userId); } catch {
			// ignore openChat error
		}
	}

	async function addFriend(userId: string) {
		if (loadingId) return;
		setLoadingId(userId);
		try {
			const res = await fetch('/api/friends/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
			const data = await res.json();
			if (res.ok) {
				const label = data?.updated === 'accepted' ? 'Friends' : data?.exists ? data?.status : 'Requested';
				setStatusById((s) => ({ ...s, [userId]: label }));
			} else {
				setStatusById((s) => ({ ...s, [userId]: 'Error' }));
			}
		} catch {
			setStatusById((s) => ({ ...s, [userId]: 'Error' }));
		} finally {
			setLoadingId(null);
		}
	}

	return (
		<aside className="fixed right-0 top-0 bottom-0 w-[300px] bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800 z-40 flex flex-col">
			<div className="p-3 text-sm font-semibold border-b border-gray-100 dark:border-neutral-800">Contacts</div>
			<div className="flex-1 overflow-auto">
				{users.map((u) => (
					<div key={u.id} className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2">
						<div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs cursor-pointer" onClick={() => openChat(u.id)}>
							{displayName(u).slice(0,1).toUpperCase()}
						</div>
						<div className="flex-1 cursor-pointer" onClick={() => openChat(u.id)}>
							<div className="text-sm font-medium">{displayName(u)}</div>
							<div className="text-xs text-gray-500">Online</div>
						</div>
						<button onClick={() => addFriend(u.id)} disabled={loadingId === u.id} className="text-xs rounded border px-2 py-1 hover:bg-gray-100 dark:hover:bg-neutral-800">
							{loadingId === u.id ? '...' : (statusById[u.id] || 'Add')}
						</button>
					</div>
				))}
			</div>
		</aside>
	);
} 

