import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { supabase } from '@/lib/supabaseClient';

const parser = new Parser();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const feedUrl = searchParams.get('url');

  // If a specific URL is provided, just parse that one (preview mode)
  if (feedUrl) {
    try {
      const feed = await parser.parseURL(feedUrl);
      return NextResponse.json({ success: true, feed });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Failed to parse feed' }, { status: 400 });
    }
  }

  // Otherwise, fetch all subscribed feeds for the user
  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
  }

  try {
    // 1. Get user subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('feed_id, feeds(url, title, icon_url)')
      .eq('user_id', userId);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    // 2. Fetch and parse all feeds in parallel
    const feedPromises = subscriptions.map(async (sub: any) => {
      try {
        const feed = await parser.parseURL(sub.feeds.url);
        return feed.items.map(item => ({
          ...item,
          source: sub.feeds.title || feed.title,
          sourceIcon: sub.feeds.icon_url,
          feedId: sub.feed_id
        }));
      } catch (e) {
        console.error(`Error parsing feed ${sub.feeds.url}:`, e);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    
    // 3. Flatten and sort by date
    const allItems = results.flat().sort((a, b) => {
      const dateA = new Date(a.isoDate || a.pubDate || 0);
      const dateB = new Date(b.isoDate || b.pubDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ success: true, items: allItems });

  } catch (error) {
    console.error('RSS Aggregation Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
