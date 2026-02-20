import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strategy 1 (PRIMARY): Jina AI Reader — free, no API key, bypasses IP blocks.
 * Jina fetches through their own infra (not Vercel/AWS IPs) and returns clean
 * article content as JSON with title + markdown body.
 */
async function fetchViaJina(
  url: string
): Promise<{ title: string; content: string; textContent: string } | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(jinaUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'html',   // ask for HTML so Readability can parse it
        'X-Timeout': '15',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    // Jina returns { data: { title, content (html/markdown), url } }
    const article = data?.data;
    if (!article?.content || article.content.length < 200) return null;

    // content can be HTML or markdown depending on X-Return-Format
    return {
      title: article.title || '',
      content: article.content,
      textContent: article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Strategy 2 (PROXY FALLBACK): allorigins.win — free open proxy that fetches
 * pages through non-AWS servers, bypassing publisher IP blocks.
 */
async function fetchViaAllOrigins(url: string): Promise<string | null> {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'Odysseus/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();
    return html && html.length > 500 ? html : null;
  } catch {
    return null;
  }
}

/**
 * Strategy 3 (DIRECT): Direct fetch — works for sites that don't block
 * Vercel/AWS IPs (smaller blogs, personal sites, open feeds, etc.)
 */
async function fetchDirect(url: string): Promise<string | null> {
  const strategies: Record<string, string>[] = [
    {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.google.com/',
    },
    {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'identity',
      'From': 'googlebot(at)googlebot.com',
    },
  ];

  for (const headers of strategies) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html') || contentType.includes('application/xhtml') || !contentType) {
          const text = await res.text();
          if (text && text.length > 500) return text;
        }
      }
    } catch {
      // continue
    }
  }
  return null;
}

/** Run Readability on an HTML string. Returns parsed article or null. */
function extractWithReadability(html: string, url: string) {
  try {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    const noiseSelectors = [
      'script', 'style', 'noscript',
      'nav', 'footer', '.ad', '.ads', '.advertisement',
      '.social-share', '.related-articles', '.newsletter-signup',
      '#comments', '.comments', '.cookie-banner', '.paywall-overlay',
    ];
    for (const sel of noiseSelectors) {
      try { doc.querySelectorAll(sel).forEach((el: Element) => el.remove()); } catch { /* ignore */ }
    }

    const reader = new Readability(doc, { charThreshold: 20, nbTopCandidates: 10, keepClasses: false });
    return reader.parse();
  } catch {
    return null;
  }
}

/** Fallback: semantic HTML selector extraction. */
function extractFallbackContent(html: string, url: string): { title: string; content: string; textContent: string } | null {
  try {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() || '';

    const contentSelectors = [
      'article [class*="body"]', 'article [class*="content"]', 'article',
      '[class*="article-body"]', '[class*="article-content"]', '[class*="story-body"]',
      '[class*="post-content"]', '[class*="entry-content"]', '[role="article"]',
      'main article', 'main', '#content', '.content',
    ];

    for (const selector of contentSelectors) {
      try {
        const el = doc.querySelector(selector);
        if (el) {
          el.querySelectorAll('script, style, nav, .ad, .ads, .social-share, aside').forEach((n: Element) => n.remove());
          const textContent = el.textContent?.trim() || '';
          if (textContent.split(/\s+/).length > 80) {
            return { title, content: el.innerHTML.trim(), textContent };
          }
        }
      } catch { /* continue */ }
    }
    return null;
  } catch {
    return null;
  }
}

/** Extract JSON-LD article body from structured data. */
function extractFromJsonLd(html: string): { title: string; content: string; textContent: string } | null {
  try {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const body = item.articleBody || item.text;
          if (body && body.length > 200) {
            return { title: item.headline || item.name || '', content: `<div><p>${body.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p></div>`, textContent: body };
          }
          if (item['@graph']) {
            for (const node of item['@graph']) {
              const nb = node.articleBody || node.text;
              if (nb && nb.length > 200) {
                return { title: node.headline || node.name || '', content: `<div><p>${nb.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p></div>`, textContent: nb };
              }
            }
          }
        }
      } catch { /* malformed JSON-LD */ }
    }
  } catch { /* ignore */ }
  return null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
  }

  try {
    // ── Step 1: Try Jina AI Reader first (bypasses Vercel/AWS IP blocks) ───
    const jinaResult = await fetchViaJina(url);
    if (jinaResult && jinaResult.content) {
      return NextResponse.json({
        success: true,
        article: {
          title: jinaResult.title,
          content: jinaResult.content,
          textContent: jinaResult.textContent,
          byline: null,
          siteName: null,
        },
      });
    }

    // ── Step 2: Try allorigins.win proxy ───────────────────────────────────
    let html = await fetchViaAllOrigins(url);

    // ── Step 3: Try direct fetch (works for non-blocked sites) ────────────
    if (!html) {
      html = await fetchDirect(url);
    }

    if (!html) {
      return NextResponse.json({ success: false, error: 'Could not retrieve the article page' }, { status: 502 });
    }

    // ── Step 4: Extract content from HTML using multiple strategies ────────
    let result: { title: string; content: string; textContent: string; byline?: string | null; siteName?: string | null } | null = null;

    // A: Readability
    const rd = extractWithReadability(html, url);
    if (rd?.content && (rd.textContent || '').split(/\s+/).length > 50) {
      result = { title: rd.title || '', content: rd.content, textContent: rd.textContent || '', byline: rd.byline, siteName: rd.siteName };
    }

    // B: JSON-LD
    if (!result) {
      const jld = extractFromJsonLd(html);
      if (jld) result = jld;
    }

    // C: DOM selectors
    if (!result) {
      const fb = extractFallbackContent(html, url);
      if (fb) result = fb;
    }

    // D: thin Readability as last resort
    if (!result && rd?.content) {
      result = { title: rd.title || '', content: rd.content, textContent: rd.textContent || '', byline: rd.byline, siteName: rd.siteName };
    }

    if (!result?.content) {
      return NextResponse.json({ success: false, error: 'Failed to parse article content' }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      article: {
        title: result.title,
        content: result.content,
        textContent: result.textContent,
        byline: result.byline || null,
        siteName: result.siteName || null,
      },
    });
  } catch (error: any) {
    console.error('Read Mode Error:', error?.message || error);
    const isTimeout = error?.name === 'AbortError' || error?.message?.includes('abort');
    return NextResponse.json(
      { success: false, error: isTimeout ? 'Request timed out' : 'Failed to fetch article content' },
      { status: isTimeout ? 504 : 500 }
    );
  }
}

