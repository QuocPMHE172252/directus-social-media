import { NextRequest } from 'next/server';
import { fetchFeed } from '@/lib/social/fetchers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '3');
    
    const { items, nextPage } = await fetchFeed({ page, pageSize });
    
    return new Response(JSON.stringify({ 
      items, 
      nextPage,
      hasMore: nextPage !== null 
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    console.error('Feed API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch feed',
      items: [],
      nextPage: null,
      hasMore: false
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
