"use client";

import { useEffect, useRef, useState } from 'react';

export function ChatWindow({ conversationId }: { conversationId: string }) {
	const [messages, setMessages] = useState<Array<any>>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);
	const [cursor, setCursor] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(true);

	function scrollToBottom() {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}

	async function loadMore(initial = false) {
		if (!hasMore && !initial) return;
		try {
			const qs = new URLSearchParams({ conversationId, limit: '20' });
			if (cursor) qs.set('before', cursor);
			const res = await fetch(`/api/messages?${qs.toString()}`, { cache: 'no-store' });
			const data = await res.json();
			if (Array.isArray(data)) {
				setMessages((prev) => [...data.reverse(), ...prev]);
				setCursor(data.length ? data[data.length - 1].id : null);
				setHasMore(data.length === 20);
				if (initial) setTimeout(scrollToBottom, 0);
			}
		} catch {}
	}

	useEffect(() => {
		setMessages([]); setCursor(null); setHasMore(true);
		loadMore(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conversationId]);

	async function send() {
		if (!input.trim() || loading) return;
		setLoading(true);
		const text = input;
		setInput('');
		// optimistic
		const tempId = `temp-${Date.now()}`;
		setMessages((prev) => [...prev, { id: tempId, sender: 'me', content: text, created_at: new Date().toISOString() }]);
		setTimeout(scrollToBottom, 0);
		try {
			const res = await fetch('/api/messages', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ conversationId, content: text }) });
			if (!res.ok) throw new Error('send failed');
		} catch {
			// revert optimistic failure mark
		}
		setLoading(false);
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 overflow-auto p-3 space-y-2" onScroll={(e) => {
				const el = e.currentTarget;
				if (el.scrollTop < 40 && hasMore) loadMore(false);
			}}>
				{messages.map((m) => (
					<div key={m.id} className={`max-w-[80%] rounded px-3 py-2 text-sm ${m.sender === 'me' ? 'ml-auto bg-blue-500 text-white' : 'bg-gray-100 dark:bg-neutral-800'}`}>
						{m.content}
						<div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
					</div>
				))}
				<div ref={bottomRef} />
			</div>
			<form className="p-3 border-t border-gray-200 dark:border-neutral-800 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
				<input className="flex-1 rounded border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 border-gray-300 dark:border-neutral-700" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message" />
				<button className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600" disabled={loading || !input.trim()} type="submit">Send</button>
			</form>
		</div>
	);
} 