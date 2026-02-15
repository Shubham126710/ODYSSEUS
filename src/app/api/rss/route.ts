import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const parser = new Parser({
  timeout: 5000, // 5s per-feed timeout
  customFields: {
    item: [
      ['media:content', 'media:content', {keepArray: true}],
      ['media:thumbnail', 'media:thumbnail', {keepArray: true}],
      ['content:encoded', 'contentEncoded'],
    ]
  }
});

// In-memory cache for parsed feeds (per-URL, 3 minute TTL)
const feedCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getCachedFeed(url: string) {
  const cached = feedCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  feedCache.delete(url);
  return null;
}

function setCachedFeed(url: string, data: any) {
  feedCache.set(url, { data, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (feedCache.size > 50) {
    const oldest = [...feedCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 10; i++) feedCache.delete(oldest[i][0]);
  }
}

// Extract image from RSS item without any network requests
function extractImageFromItem(item: any): string | null {
  // 1. Enclosure
  let imageUrl = item.enclosure?.url;

  // 2. media:content
  if (!imageUrl && item['media:content']) {
    if (Array.isArray(item['media:content'])) {
      const imageMedia = item['media:content'].find((m: any) =>
        m['$']?.medium === 'image' || m['$']?.type?.startsWith('image') || m.medium === 'image' || m.type?.startsWith('image')
      );
      imageUrl = imageMedia?.['$']?.url || imageMedia?.url || item['media:content'][0]?.['$']?.url || item['media:content'][0]?.url;
    } else {
      imageUrl = item['media:content']?.['$']?.url || item['media:content']?.url;
    }
  }

  // 3. media:thumbnail
  if (!imageUrl && item['media:thumbnail']) {
    if (Array.isArray(item['media:thumbnail'])) {
      imageUrl = item['media:thumbnail'][0]?.['$']?.url || item['media:thumbnail'][0]?.url;
    } else {
      imageUrl = item['media:thumbnail']?.['$']?.url || item['media:thumbnail']?.url;
    }
  }

  // 4. Extract from content HTML
  if (!imageUrl && (item.contentEncoded || item.content)) {
    const content = item.contentEncoded || item.content;
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) imageUrl = imgMatch[1];
  }

  return imageUrl || null;
}

// Lightweight OG image fetch — 1s timeout, reads only <head>
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Odysseus/1.0 (bot)' },
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = '';
    const decoder = new TextDecoder();
    while (html.length < 30000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes('</head>')) break;
    }
    reader.cancel();

    const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
                    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    if (ogMatch) return ogMatch[1];

    const twMatch = html.match(/<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i) ||
                    html.match(/<meta[^>]+content="([^"]+)"[^>]+name="twitter:image"/i);
    if (twMatch) return twMatch[1];
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const feedUrl = searchParams.get('url');
  const mode = searchParams.get('mode');

  // Handle Trending Mode
  if (mode === 'trending') {
    try {
      const trendingFeeds = [
        'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
        'http://feeds.bbci.co.uk/news/rss.xml',
        'https://www.wired.com/feed/rss'
      ];

      const feedPromises = trendingFeeds.map(url => parser.parseURL(url).catch(() => null));
      const results = await Promise.all(feedPromises);

      const headlines: any[] = [];
      results.forEach(feed => {
        if (feed && feed.items) {
          // Take top 5 from each
          feed.items.slice(0, 5).forEach(item => {
            headlines.push({
              title: item.title,
              link: item.link,
              source: feed.title || 'News'
            });
          });
        }
      });

      // Shuffle headlines
      const shuffled = headlines.sort(() => 0.5 - Math.random());

      return NextResponse.json({ success: true, headlines: shuffled });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Failed to fetch trending' }, { status: 500 });
    }
  }

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
    console.error('RSS API: Missing userId');
    return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
  }

  try {
    // Create an authenticated Supabase client using the user's token
    const authHeader = request.headers.get('Authorization');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    console.log(`RSS API: Fetching feeds for user ${userId}`);
    // 1. Get user subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('feed_id, feeds(url, title, icon_url)')
      .eq('user_id', userId);

    if (subError) {
      console.error('RSS API: Subscription fetch error', subError);
      throw subError;
    }

    console.log(`RSS API: Found ${subscriptions?.length || 0} subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    // 2. Fetch and parse all feeds in parallel (with caching)
    const feedPromises = subscriptions.map(async (sub: any) => {
      if (!sub.feeds) {
        console.warn(`RSS API: Subscription ${sub.feed_id} has no feed data`);
        return [];
      }
      try {
        const feedUrl = sub.feeds.url;
        
        // Check in-memory cache first
        let feed = getCachedFeed(feedUrl);
        if (!feed) {
          console.log(`RSS API: Parsing feed ${feedUrl}`);
          feed = await parser.parseURL(feedUrl);
          setCachedFeed(feedUrl, feed);
        } else {
          console.log(`RSS API: Cache hit for ${feedUrl}`);
        }
        
        // Process items — extract images from RSS fields first, then OG fetch for a few
        const items = feed.items.slice(0, 15);
        const processed = items.map((item: any) => ({
          ...item,
          source: sub.feeds.title || feed.title,
          sourceIcon: sub.feeds.icon_url,
          feedId: sub.feed_id,
          imageUrl: extractImageFromItem(item),
        }));

        // OG fetch only for items without images (max 3 per feed, in parallel)
        const noImage = processed.filter((p: any) => !p.imageUrl && p.link);
        const ogTargets = noImage.slice(0, 3);
        if (ogTargets.length > 0) {
          const ogResults = await Promise.all(
            ogTargets.map((p: any) => fetchOgImage(p.link).then(url => ({ link: p.link, url })))
          );
          const ogMap = new Map(ogResults.filter(r => r.url).map(r => [r.link, r.url]));
          for (const p of processed) {
            if (!p.imageUrl && ogMap.has(p.link)) {
              p.imageUrl = ogMap.get(p.link);
            }
          }
        }

        return processed;
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

    return NextResponse.json({ success: true, items: allItems }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      }
    });

  } catch (error) {
    console.error('RSS Aggregation Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
