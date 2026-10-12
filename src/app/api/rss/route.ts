import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import { getDefaultInauguralFeeds } from '@/data/prestigeSources';
import { clusterStories } from '@/lib/storyClustering';
import { upgradeThumbnailResolution } from '@/lib/textUtils';

const parser = new Parser({
  timeout: 8000, // 8s per-feed timeout for large XML feeds
  customFields: {
    item: [
      ['media:content', 'media:content', {keepArray: true}],
      ['media:thumbnail', 'media:thumbnail', {keepArray: true}],
      ['media:group', 'mediaGroup'],
      ['content:encoded', 'contentEncoded'],
      ['image', 'image'],
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

// In-memory OG image cache (URL -> image URL, 1 hour TTL)
const ogImageCache = new Map<string, { url: string | null; timestamp: number }>();
const OG_CACHE_TTL = 60 * 60 * 1000;

// Extract image from RSS item without any network requests
function extractImageFromItem(item: any): string | null {
  let imageUrl: string | null = null;

  // 1. Enclosure (validate it's actually an image, not a podcast MP3)
  if (item.enclosure?.url) {
    const encUrl = String(item.enclosure.url);
    const encType = String(item.enclosure.type || '').toLowerCase();
    if (encType.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(encUrl)) {
      imageUrl = encUrl;
    }
  }

  // 2. media:content (direct or inside media:group)
  const mediaContent = item['media:content'] || item.mediaGroup?.['media:content'];
  if (!imageUrl && mediaContent) {
    if (Array.isArray(mediaContent)) {
      const sorted = [...mediaContent].sort((a: any, b: any) => {
        const wA = parseInt(a['$']?.width || a.width || 0, 10);
        const wB = parseInt(b['$']?.width || b.width || 0, 10);
        return wB - wA;
      });
      const best = sorted[0];
      imageUrl = best?.['$']?.url || best?.url || mediaContent[0]?.['$']?.url || mediaContent[0]?.url;
    } else {
      imageUrl = mediaContent?.['$']?.url || mediaContent?.url;
    }
  }

  // 3. media:thumbnail (direct or inside media:group)
  const mediaThumbnail = item['media:thumbnail'] || item.mediaGroup?.['media:thumbnail'];
  if (!imageUrl && mediaThumbnail) {
    if (Array.isArray(mediaThumbnail)) {
      imageUrl = mediaThumbnail[0]?.['$']?.url || mediaThumbnail[0]?.url;
    } else {
      imageUrl = mediaThumbnail?.['$']?.url || mediaThumbnail?.url;
    }
  }

  // 4. item.image
  if (!imageUrl && item.image) {
    imageUrl = typeof item.image === 'string' ? item.image : item.image?.url || null;
  }

  // 5. Extract from content HTML or description (both raw and entity-encoded)
  if (!imageUrl) {
    const textSources = [
      item.contentEncoded,
      item.content,
      item.description,
      item.summary,
    ].filter(Boolean);

    for (const raw of textSources) {
      if (typeof raw !== 'string') continue;
      // Direct <img> tag
      const imgMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && !imgMatch[1].includes('feedburner') && !imgMatch[1].includes('1x1') && !imgMatch[1].includes('tracking')) {
        imageUrl = imgMatch[1];
        break;
      }
      // XML-escaped &lt;img ...&gt;
      const escapedMatch = raw.match(/&lt;img[^&]+src=[&"']+([^&"'\s>]+)[&"']/i);
      if (escapedMatch && !escapedMatch[1].includes('feedburner') && !escapedMatch[1].includes('1x1')) {
        imageUrl = escapedMatch[1];
        break;
      }
      // Markdown image ![...](...)
      const mdMatch = raw.match(/!\[.*?\]\((https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp|avif)[^\s)]*)\)/i);
      if (mdMatch) {
        imageUrl = mdMatch[1];
        break;
      }
    }
  }

  // Sanitize and clean URL
  if (imageUrl && typeof imageUrl === 'string') {
    imageUrl = imageUrl.trim().replace(/&amp;/g, '&');
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }
    imageUrl = upgradeThumbnailResolution(imageUrl) || imageUrl;
  }

  return imageUrl || null;
}

// Resilient OG image fetch with real browser User-Agent and in-memory cache
async function fetchOgImage(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;

  // Check cache
  const cached = ogImageCache.get(url);
  if (cached && Date.now() - cached.timestamp < OG_CACHE_TTL) {
    return cached.url;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      ogImageCache.set(url, { url: null, timestamp: Date.now() });
      return null;
    }

    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = '';
    const decoder = new TextDecoder();
    while (html.length < 60000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes('</head>')) break;
    }
    reader.cancel();

    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1].startsWith('http')) {
      const up = upgradeThumbnailResolution(ogMatch[1]) || ogMatch[1];
      ogImageCache.set(url, { url: up, timestamp: Date.now() });
      return up;
    }

    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twMatch && twMatch[1].startsWith('http')) {
      const up = upgradeThumbnailResolution(twMatch[1]) || twMatch[1];
      ogImageCache.set(url, { url: up, timestamp: Date.now() });
      return up;
    }

    ogImageCache.set(url, { url: null, timestamp: Date.now() });
    return null;
  } catch {
    ogImageCache.set(url, { url: null, timestamp: Date.now() });
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

  try {
    const mapDeskAndCategory = (desk?: string, name?: string) => {
      const d = (desk || '').toLowerCase();
      const n = (name || '').toLowerCase();
      if (d === 'vanguard' || n.includes('tech') || n.includes('verge') || n.includes('wired') || n.includes('polygon') || n.includes('technology review')) {
        return { desk: 'vanguard', category: 'tech' };
      }
      if (d === 'atelier' || n.includes('design') || n.includes('dezeen') || n.includes('smashing') || n.includes('boom')) {
        return { desk: 'atelier', category: 'design' };
      }
      if (d === 'forum' || n.includes('culture') || n.includes('atlantic') || n.includes('aeon') || n.includes('new yorker')) {
        return { desk: 'forum', category: 'culture' };
      }
      if (d === 'observatory' || n.includes('science') || n.includes('quanta') || n.includes('scientific') || n.includes('phys')) {
        return { desk: 'observatory', category: 'science' };
      }
      if (d === 'sports' || n.includes('sport')) {
        return { desk: 'sports', category: 'sports' };
      }
      if (d === 'chronicle' || n.includes('bloomberg') || n.includes('reuters') || n.includes('market')) {
        return { desk: 'chronicle', category: 'chronicle' };
      }
      return { desk: 'general', category: 'general' };
    };

    let userFeeds: Array<{ url: string; title: string; icon_url?: string; feed_id?: string; desk: string; category: string }> = [];

    // 1. If user ID provided, attempt to fetch user subscriptions
    if (userId) {
      try {
        const authHeader = request.headers.get('Authorization');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: authHeader || '' } } }
        );

        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select('feed_id, feeds(url, title, icon_url)')
          .eq('user_id', userId);

        if (subscriptions && subscriptions.length > 0) {
          userFeeds = subscriptions
            .filter((sub: any) => sub.feeds && sub.feeds.url)
            .map((sub: any) => {
              const meta = mapDeskAndCategory(undefined, sub.feeds.title);
              return {
                url: sub.feeds.url,
                title: sub.feeds.title,
                icon_url: sub.feeds.icon_url,
                feed_id: sub.feed_id,
                desk: meta.desk,
                category: meta.category,
              };
            });
        }
      } catch (subErr) {
        console.warn('RSS API: Error fetching user subscriptions, falling back to curated feeds:', subErr);
      }
    }

    // 2. Curated prestige feeds for each core magazine desk
    const inaugural = getDefaultInauguralFeeds();
    const curatedFeeds = inaugural.map((pub) => {
      const meta = mapDeskAndCategory(pub.desk, pub.name);
      return {
        url: pub.feedUrl,
        title: pub.name,
        icon_url: `${pub.url}/favicon.ico`,
        feed_id: pub.id,
        desk: meta.desk,
        category: meta.category,
      };
    });

    // Merge: user-subscribed feeds first, plus curated feeds to ensure ALL magazine desks are represented
    const seenUrls = new Set<string>();
    const targetFeeds: Array<{ url: string; title: string; icon_url?: string; feed_id?: string; desk: string; category: string }> = [];

    for (const f of userFeeds) {
      if (!seenUrls.has(f.url)) {
        seenUrls.add(f.url);
        targetFeeds.push(f);
      }
    }
    for (const f of curatedFeeds) {
      if (!seenUrls.has(f.url)) {
        seenUrls.add(f.url);
        targetFeeds.push(f);
      }
    }

    // 3. Fetch and parse all feeds in parallel (with caching)
    const feedPromises = targetFeeds.map(async (sub) => {
      try {
        const feedUrl = sub.url;
        
        // Check in-memory cache first
        let feed = getCachedFeed(feedUrl);
        if (!feed) {
          feed = await parser.parseURL(feedUrl);
          setCachedFeed(feedUrl, feed);
        }
        
        // Process items — extract images from RSS fields first, then OG fetch for a few
        const items = feed.items.slice(0, 15);
        const processed = items.map((item: any) => ({
          ...item,
          source: sub.title || feed.title,
          sourceIcon: sub.icon_url,
          feedId: sub.feed_id,
          desk: sub.desk || item.desk || null,
          category: sub.category || item.category || null,
          imageUrl: extractImageFromItem(item),
        }));

        // OG fetch for items without images (up to 4 per feed, fast parallel)
        const noImage = processed.filter((p: any) => !p.imageUrl && p.link);
        const ogTargets = noImage.slice(0, 4);
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
        console.error(`Error parsing feed ${sub.url}:`, e);
        // Fall back to stale cache if available
        const stale = feedCache.get(sub.url)?.data;
        if (stale && stale.items) {
          const items = stale.items.slice(0, 15);
          return items.map((item: any) => ({
            ...item,
            source: sub.title || stale.title,
            sourceIcon: sub.icon_url,
            feedId: sub.feed_id,
            desk: sub.desk || item.desk || null,
            category: sub.category || item.category || null,
            imageUrl: extractImageFromItem(item),
          }));
        }
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    
    // 4. Flatten, sort by publication date, and apply story clustering
    const allItems = results.flat().sort((a, b) => {
      const dateA = new Date(a.isoDate || a.pubDate || 0);
      const dateB = new Date(b.isoDate || b.pubDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    const clusteredItems = clusterStories(allItems);

    return NextResponse.json({ success: true, items: clusteredItems }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      }
    });

  } catch (error) {
    console.error('RSS Aggregation Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
