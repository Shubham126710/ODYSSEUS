import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export const runtime = 'nodejs';
export const maxDuration = 45;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch HTML with realistic browser headers, rotating strategies. */
async function fetchHTML(url: string): Promise<string | null> {
  const strategies: Record<string, string>[] = [
    // Strategy 1: Full Chrome-like browser request
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
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.google.com/',
    },
    // Strategy 2: Googlebot (many paywalled sites serve full content to Googlebot)
    {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'identity',
      'From': 'googlebot(at)googlebot.com',
    },
    // Strategy 3: curl-like minimal request
    {
      'User-Agent': 'curl/8.4.0',
      'Accept': '*/*',
    },
  ];

  for (const headers of strategies) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        // Only accept HTML responses
        if (contentType.includes('text/html') || contentType.includes('application/xhtml') || !contentType) {
          const text = await res.text();
          if (text && text.length > 200) return text;
        }
      }
    } catch {
      // continue to next strategy
    }
  }
  return null;
}

/** Try fetching a Google webcache version as a last-resort fallback. */
async function fetchGoogleCache(url: string): Promise<string | null> {
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}&strip=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(cacheUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (res.ok) {
      const html = await res.text();
      if (html && html.length > 500) return html;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Run Readability on an HTML string. Returns parsed article or null. */
function extractWithReadability(html: string, url: string) {
  try {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    // Remove known noise elements that confuse Readability
    const noiseSelectors = [
      'script', 'style', 'noscript', 'iframe[src*="ads"]',
      'nav', 'footer', '.ad', '.ads', '.advertisement',
      '.social-share', '.related-articles', '.newsletter-signup',
      '#comments', '.comments', '.cookie-banner', '.paywall-overlay',
      '[aria-hidden="true"]',
    ];
    for (const sel of noiseSelectors) {
      try {
        doc.querySelectorAll(sel).forEach((el: Element) => el.remove());
      } catch {
        // ignore invalid selector
      }
    }

    const reader = new Readability(doc, {
      charThreshold: 20,
      nbTopCandidates: 10,
      keepClasses: false,
    });
    return reader.parse();
  } catch (e) {
    console.error('Readability extraction error:', e);
    return null;
  }
}

/** Fallback: Extract content directly from known semantic HTML tags. */
function extractFallbackContent(html: string, url: string): { title: string; content: string; textContent: string } | null {
  try {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    // Try to get the title
    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() ||
      '';

    // Try progressively broader selectors for the article body
    const contentSelectors = [
      'article [class*="body"]',
      'article [class*="content"]',
      'article',
      '[class*="article-body"]',
      '[class*="article-content"]',
      '[class*="story-body"]',
      '[class*="post-content"]',
      '[class*="entry-content"]',
      '[role="article"]',
      'main article',
      'main',
      '#content',
      '.content',
    ];

    for (const selector of contentSelectors) {
      try {
        const el = doc.querySelector(selector);
        if (el) {
          // Remove noise inside the selected element
          el.querySelectorAll('script, style, nav, .ad, .ads, .social-share, .related-articles, aside').forEach((n: Element) => n.remove());

          const innerHtml = el.innerHTML.trim();
          const textContent = el.textContent?.trim() || '';
          // Only accept if there is meaningful content (at least ~100 words)
          if (textContent.split(/\s+/).length > 80) {
            return { title, content: innerHtml, textContent };
          }
        }
      } catch {
        // continue
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Extract JSON-LD article body if the page embeds structured data. */
function extractFromJsonLd(html: string): { title: string; content: string; textContent: string } | null {
  try {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          // Check for Article types
          const articleBody = item.articleBody || item.text;
          if (articleBody && articleBody.length > 200) {
            return {
              title: item.headline || item.name || '',
              content: `<div>${articleBody.replace(/\n/g, '</p><p>')}</div>`,
              textContent: articleBody,
            };
          }
          // Check @graph (common in Yoast SEO)
          if (item['@graph']) {
            for (const node of item['@graph']) {
              const body = node.articleBody || node.text;
              if (body && body.length > 200) {
                return {
                  title: node.headline || node.name || '',
                  content: `<div>${body.replace(/\n/g, '</p><p>')}</div>`,
                  textContent: body,
                };
              }
            }
          }
        }
      } catch {
        // Malformed JSON-LD, skip
      }
    }
  } catch {
    // ignore
  }
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
    // ----- Step 1: Fetch the HTML ------------------------------------------
    let html = await fetchHTML(url);

    if (!html) {
      // Fallback: try Google webcache
      console.log(`Direct fetch failed for ${url}, trying Google cache...`);
      html = await fetchGoogleCache(url);
    }

    if (!html) {
      console.error(`All fetch strategies failed for ${url}`);
      return NextResponse.json({ success: false, error: 'Could not retrieve the article page' }, { status: 502 });
    }

    // ----- Step 2: Try extracting content (multiple strategies) -------------
    let result: { title: string; content: string; textContent: string; byline?: string | null; siteName?: string | null } | null = null;

    // Strategy A: Readability (best quality)
    const readabilityResult = extractWithReadability(html, url);
    if (readabilityResult && readabilityResult.content) {
      const wordCount = (readabilityResult.textContent || '').split(/\s+/).length;
      if (wordCount > 50) {
        result = {
          title: readabilityResult.title || '',
          content: readabilityResult.content,
          textContent: readabilityResult.textContent || '',
          byline: readabilityResult.byline,
          siteName: readabilityResult.siteName,
        };
      }
    }

    // Strategy B: JSON-LD structured data
    if (!result) {
      console.log(`Readability insufficient for ${url}, trying JSON-LD...`);
      const jsonLdResult = extractFromJsonLd(html);
      if (jsonLdResult) {
        result = jsonLdResult;
      }
    }

    // Strategy C: DOM fallback (semantic HTML selectors)
    if (!result) {
      console.log(`JSON-LD failed for ${url}, trying DOM fallback...`);
      const fallback = extractFallbackContent(html, url);
      if (fallback) {
        result = fallback;
      }
    }

    // Strategy D: If we got Readability result but it was thin, use it anyway
    if (!result && readabilityResult && readabilityResult.content) {
      result = {
        title: readabilityResult.title || '',
        content: readabilityResult.content,
        textContent: readabilityResult.textContent || '',
        byline: readabilityResult.byline,
        siteName: readabilityResult.siteName,
      };
    }

    if (!result || !result.content) {
      console.error(`All extraction strategies failed for ${url}`);
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

