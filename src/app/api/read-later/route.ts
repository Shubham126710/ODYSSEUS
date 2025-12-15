import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_articles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
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

    const { error } = await supabase
      .from('saved_articles')
      .insert({
        user_id: userId,
        url,
        title,
        excerpt,
        image_url,
        source: source_name,
        content
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Article saved' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
