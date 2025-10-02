import { NextRequest } from 'next/server';
import { useDirectus } from '@/lib/directus/directus';
import { readItems, withToken } from '@directus/sdk';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  if (!postId) return new Response(JSON.stringify({ error: 'Missing postId' }), { status: 400, headers: { 'content-type': 'application/json' } });

  const { directus } = useDirectus();
  const publicToken = process.env.DIRECTUS_PUBLIC_TOKEN;

  try {
    let comments: any[] | undefined;
    // Try field 'post'
    const requestPost = readItems('comments' as any, { fields: ['id'], filter: { post: { _eq: postId } }, limit: -1 } as any);
    try {
      comments = (await directus.request(publicToken ? withToken(publicToken, requestPost as any) : (requestPost as any))) as any[];
    } catch {
      // Fallback to field 'post_id'
      const requestPostId = readItems('comments' as any, { fields: ['id'], filter: { post_id: { _eq: postId } }, limit: -1 } as any);
      comments = (await directus.request(publicToken ? withToken(publicToken, requestPostId as any) : (requestPostId as any))) as any[];
    }

    const count = Array.isArray(comments) ? comments.length : 0;
    return new Response(JSON.stringify({ count }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    console.error('comments/count error:', e);
    // Soft-fail to avoid UI breaking
    return new Response(JSON.stringify({ count: 0 }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
} 