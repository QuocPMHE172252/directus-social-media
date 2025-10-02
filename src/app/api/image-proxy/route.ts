export const runtime = 'edge';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const id = searchParams.get('id');
	if (!id) {
		return new Response('Missing id', { status: 400 });
	}

	const baseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
	if (!baseUrl) {
		return new Response('Missing NEXT_PUBLIC_DIRECTUS_URL', { status: 500 });
	}

	const assetUrl = `${baseUrl.replace(/\/$/, '')}/assets/${encodeURIComponent(id)}`;
	const resp = await fetch(assetUrl, { cache: 'no-store' });
	if (!resp.ok) {
		return new Response('Asset fetch failed', { status: resp.status });
	}

	const contentType = resp.headers.get('content-type') ?? 'application/octet-stream';
	return new Response(resp.body, {
		status: 200,
		headers: {
			'content-type': contentType,
			'cache-control': 'no-store',
		},
	});
} 