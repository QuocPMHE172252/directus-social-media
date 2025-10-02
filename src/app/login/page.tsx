"use client";

import { useState, FormEvent } from 'react';

export default function LoginPage() {
	const [email, setEmail] = useState('admin@example.com');
	const [password, setPassword] = useState('d1r3ctu5');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});
			if (!res.ok) throw new Error(await res.text());
			// Force full reload to ensure all client components pick up the new cookie/session immediately
			window.location.replace('/feed');
		} catch (e: any) {
			setError(e?.message || 'Login failed');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="container mx-auto px-4 py-10 max-w-md">
			<h1 className="text-2xl font-semibold mb-4">Login</h1>
			<form onSubmit={onSubmit} className="space-y-3">
				<input className="w-full rounded border px-3 py-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
				<input className="w-full rounded border px-3 py-2 text-sm" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
				<button className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground" disabled={loading}>
					{loading ? 'Logging in…' : 'Login'}
				</button>
				{error ? <div className="text-sm text-red-600">{error}</div> : null}
			</form>
		</div>
	);
} 