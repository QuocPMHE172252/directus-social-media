"use client";

import { useEffect, useState } from 'react';
import { ConversationsList } from '@/components/messages/ConversationsList';
import { ChatWindow } from '@/components/messages/ChatWindow';

export default function MessagesPage() {
	const [conversationId, setConversationId] = useState<string | null>(null);

	useEffect(() => {
		// load first conversation as default
		(async () => {
			try {
				const res = await fetch('/api/conversations', { cache: 'no-store' });
				const data = await res.json();
				if (data?.items?.length) setConversationId(data.items[0].id);
			} catch {}
		})();
	}, []);

	return (
		<div className="mx-auto w-full max-w-5xl px-2 sm:px-4 py-4 sm:py-6">
			<h1 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Messages</h1>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="md:col-span-1 rounded border border-gray-200 dark:border-neutral-800">
					<ConversationsList onSelect={(id) => setConversationId(id)} selectedId={conversationId} />
				</div>
				<div className="md:col-span-2 rounded border border-gray-200 dark:border-neutral-800 min-h-[60vh]">
					{conversationId ? (
						<ChatWindow conversationId={conversationId} />
					) : (
						<div className="p-4 text-sm text-muted-foreground">Select a conversation</div>
					)}
				</div>
			</div>
		</div>
	);
} 