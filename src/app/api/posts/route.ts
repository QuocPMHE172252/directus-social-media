import { NextRequest } from 'next/server';
import { useDirectus } from '@/lib/directus/directus';
import { createItem, withToken } from '@directus/sdk';
import { requireUserToken } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body?.title === 'string' ? body.title.slice(0, 200) : null;
    const description = typeof body?.content === 'string' ? body.content.slice(0, 5000) : null;
    const image = typeof body?.image === 'string' ? body.image : null;

    if (!title && !description && !image) {
      return new Response('Title, content, or image is required', { status: 400 });
    }

    const { directus } = useDirectus();

    // Require a logged-in user so user_created is set properly
    const token = await requireUserToken();

    const payload: any = {
      title: title ?? null,
      description: description ?? null,
      image: image ?? null,
      status: 'published',
      published_at: new Date().toISOString(),
    };

    console.log('Creating post with payload (user token):', payload);

    const created = await (directus as any).request(
      (withToken as any)(token as any, createItem('posts' as any, payload as any) as any) as any,
    );

    console.log('Post created successfully:', created);

    return new Response(JSON.stringify({ id: (created as any)?.id }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Post creation error:', err);
    const msg = String(err?.message || '').toUpperCase();
    const status = Number((err as any)?.response?.status || 0);
    if (status === 401 || msg.includes('UNAUTHORIZED') || msg.includes('INVALID USER CREDENTIALS')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ 
      error: 'Failed to create post', 
      details: err.message 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
