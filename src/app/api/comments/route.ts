import { NextRequest } from 'next/server';
import { useDirectus, useDirectusWrite } from '@/lib/directus/directus';
import { createItem, withToken, readItems } from '@directus/sdk';
import { requireUserToken, getCurrentUserId } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  const page = Number(searchParams.get('page') || '1') || 1;
  const pageSize = Number(searchParams.get('pageSize') || '10') || 10;
  
  if (!postId) return new Response('Missing postId', { status: 400 });
  
  const { directus } = useDirectus();
  const publicToken = process.env.DIRECTUS_PUBLIC_TOKEN;
  
  try {
    const request = readItems('comments' as any, {
      fields: ['id', 'user', 'content', 'created_at'],
      filter: { post: { _eq: postId } },
      sort: ['-created_at'],
      limit: pageSize,
      page,
    } as any);

    const items = (await (directus as any).request(
      publicToken ? (withToken(publicToken, request as any) as any) : (request as any),
    )) as any[];
    
    return new Response(JSON.stringify(items ?? []), { 
      status: 200, 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (e) {
    console.error('Error fetching comments:', e);
    return new Response(JSON.stringify([]), { 
      status: 200, 
      headers: { 'content-type': 'application/json' } 
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postId = String(body?.postId || '');
    const content = String(body?.content || '').slice(0, 2000);
    
    if (!postId || !content.trim()) {
      return new Response('Missing postId or content', { status: 400 });
    }

    const { directus } = useDirectusWrite();

    // Prefer user token if signed in; fall back to public token
    let token: string | null = null;
    let userId: string | null = null;
    try {
      token = await requireUserToken();
      userId = await getCurrentUserId();
    } catch {
      // ignore, will fall back to public token
    }
    if (!token) {
      const publicToken = process.env.DIRECTUS_PUBLIC_TOKEN || '';
      if (!publicToken) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { 'content-type': 'application/json' } });
      }
      token = publicToken;
    }

    console.log('Creating comment:', { postId, content });

    // Build payload using `post` relation only
    const payload: any = { content: content.trim(), post: postId };
    if (userId) payload.user = userId;

    const op: any = (withToken as any)(token as string, createItem('comments' as any, payload as any) as any);
    const created = await (directus as any).request(op);

    console.log('Comment created successfully:', created);

    return new Response(JSON.stringify({ id: (created as any)?.id }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    console.error('Comment creation error:', e);
    if (String(e?.message || '') === 'UNAUTHORIZED') return new Response('Unauthorized', { status: 401 });
    return new Response(JSON.stringify({ 
      error: 'Failed to create comment', 
      details: e?.message || 'unknown'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
