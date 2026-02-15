import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to create a Supabase client with the user's auth context
const createSupabaseClient = (request: Request) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    }
  );
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
  }

  const supabase = createSupabaseClient(request);

  const { data, error } = await supabase
    .from('saved_articles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /api/read-later error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, items: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, url, title, excerpt, image_url, source_name, content } = body;

    if (!userId || !url) {
      return NextResponse.json({ success: false, error: 'User ID and URL required' }, { status: 400 });
    }

    const supabase = createSupabaseClient(request);

    const { error } = await supabase
      .from('saved_articles')
      .upsert({
        user_id: userId,
        url,
        title,
        excerpt,
        image_url,
        source: source_name,
        content
      }, { onConflict: 'user_id, url' });

    if (error) {
      console.error('POST /api/read-later error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Article saved' });
  } catch (error: any) {
    console.error('POST /api/read-later exception:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error', details: error }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const url = searchParams.get('url');

  if (!userId || !url) {
    return NextResponse.json({ success: false, error: 'User ID and URL required' }, { status: 400 });
  }

  const supabase = createSupabaseClient(request);

  const { error } = await supabase
    .from('saved_articles')
    .delete()
    .match({ user_id: userId, url: url });

  if (error) {
    console.error('DELETE /api/read-later error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Article removed' });
}
