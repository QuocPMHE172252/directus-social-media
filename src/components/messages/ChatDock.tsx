"use client";

import { useCallback, useEffect, useState } from 'react';
import { ChatWindow } from '@/components/messages/ChatWindow';

export function ChatDock() {
	const [windows, setWindows] = useState<Array<{ key: string; conversationId: string }>>([]);

	const open = useCallback(async (userId: string) => {
		try {
			const res = await fetch('/api/conversations/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
			const data = await res.json();
			if (data?.conversationId) {
				setWindows((prev) => {
					const exists = prev.find((w) => w.conversationId === data.conversationId);
					if (exists) return prev;
					return [...prev, { key: `${data.conversationId}-${Date.now()}`, conversationId: data.conversationId }];
				});
			}
		} catch {}
	}, []);

	useEffect(() => {
		(window as any).__openChat = open; // for FriendsSidebar to call
	}, [open]);

	function close(key: string) {
		setWindows((prev) => prev.filter((w) => w.key !== key));
	}

	return (
		<div className="fixed bottom-4 right-[316px] z-50 flex flex-row-reverse gap-3">
			{windows.map((w) => (
				<div key={w.key} className="w-[320px] h-[420px] rounded shadow-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 overflow-hidden">
					<div className="h-10 flex items-center justify-between px-3 border-b border-gray-100 dark:border-neutral-800 text-sm">
						<span>Chat</span>
						<button className="text-xs hover:underline" onClick={() => close(w.key)}>Close</button>
					</div>
					<div className="h-[calc(100%-2.5rem)]">
						<ChatWindow conversationId={w.conversationId} />
					</div>
				</div>
			))}
		</div>
	);
} 