"use client";

import { useEffect, useState } from 'react';

export function ConversationsList({ onSelect, selectedId }: { onSelect: (id: string) => void; selectedId: string | null }) {
	const [items, setItems] = useState<Array<{ id: string; last?: any }>>([]);

	async function load() {
		try {
			const res = await fetch('/api/conversations', { cache: 'no-store' });
			const data = await res.json();
			setItems(data?.items || []);
		} catch {}
	}

	useEffect(() => { load(); }, []);

	return (
		<div className="divide-y divide-gray-100 dark:divide-neutral-800">
			{items.length === 0 ? (
				<div className="p-4 text-sm text-muted-foreground">No conversations</div>
			) : (
				items.map((c) => (
					<button key={c.id} onClick={() => onSelect(c.id)} className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-neutral-800 ${selectedId === c.id ? 'bg-gray-50 dark:bg-neutral-800' : ''}`}>
						<div className="text-sm font-medium">{c.id.slice(0, 8)}</div>
						<div className="text-xs text-gray-500 dark:text-neutral-400 truncate">{c?.last?.content || 'No messages yet'}</div>
					</button>
				))
			)}
		</div>
	);
} 