import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Fetch strategies
// ---------------------------------------------------------------------------

/** Jina AI Reader — works for most sites that allow AI reader access. */
async function fetchViaJina(url: string): Promise<{ title: string; content: string; textContent: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'application/json', 'X-Timeout': '15' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    // Non-200 codes (e.g. 451 legal block, 403 blocked) mean we can't use this
    if (data.code && data.code !== 200) return null;

    const article = data?.data;
    if (!article?.content || article.content.length < 200) return null;

    // Jina returns Markdown — convert to basic HTML for the reader
    const html = markdownToHtml(article.content);
    return {
      title: article.title || '',
      content: html,
      textContent: article.content.replace(/[#*`\[\]()!>]/g, '').replace(/\s+/g, ' ').trim(),
    };
  } catch {
    return null;
  }
}

/** Internet Archive Wayback Machine — for recently-archived articles. */
async function fetchViaWayback(url: string): Promise<string | null> {
  try {
    const availRes = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!availRes.ok) return null;
    const avail = await availRes.json();
    const snapshotUrl: string | undefined = avail?.archived_snapshots?.closest?.url;
    if (!snapshotUrl) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const pageRes = await fetch(snapshotUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!pageRes.ok) return null;
    const html = await pageRes.text();
    return html.length > 500 ? html : null;
  } catch {
    return null;
  }
}

/** Direct fetch — works for blogs and sites that don't block Vercel IPs. */
async function fetchDirect(url: string): Promise<string | null> {
  const headerSets: Record<string, string>[] = [
    {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Referer': 'https://www.google.com/',
      'Upgrade-Insecure-Requests': '1',
    },
    {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'From': 'googlebot(at)googlebot.com',
    },
  ];

  for (const h of headerSets) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { headers: h, signal: controller.signal, redirect: 'follow' });
      clearTimeout(timeout);
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('text/html') || ct.includes('xhtml') || !ct) {
          const text = await res.text();
          if (text && text.length > 500) return text;
        }
      }
    } catch { /* try next */ }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Content extraction
// ---------------------------------------------------------------------------

function extractWithReadability(html: string, url: string) {
  try {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    for (const sel of ['script', 'style', 'noscript', 'nav', 'footer', '.ad', '.ads',
      '.advertisement', '.paywall-overlay', '.cookie-banner', '#comments', '.comments']) {
      try { doc.querySelectorAll(sel).forEach((el: Element) => el.remove()); } catch { /* skip */ }
    }
    return new Readability(doc, { charThreshold: 20, nbTopCandidates: 10, keepClasses: false }).parse();
  } catch { return null; }
}

function extractFromJsonLd(html: string): { title: string; content: string; textContent: string } | null {
  try {
    const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      try {
        const d = JSON.parse(m[1]);
        const flat: any[] = Array.isArray(d) ? d : [d];
        for (const it of flat) if (it['@graph']) flat.push(...it['@graph']);
        for (const node of flat) {
          const body = node.articleBody || node.text;
          if (body && body.length > 300) {
            return {
              title: node.headline || node.name || '',
              content: `<div><p>${body.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p></div>`,
              textContent: body,
            };
          }
        }
      } catch { /* bad JSON-LD */ }
    }
  } catch { /* ignore */ }
  return null;
}

function extractFallbackContent(html: string, url: string): { title: string; content: string; textContent: string } | null {
  try {
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() || '';

    for (const sel of ['article [class*="body"]', 'article', '[class*="article-body"]',
      '[class*="article-content"]', '[class*="story-body"]', '[class*="post-content"]',
      '[class*="entry-content"]', '[role="article"]', 'main', '#content']) {
      try {
        const el = doc.querySelector(sel);
        if (el) {
          el.querySelectorAll('script,style,nav,.ad,.ads,.social-share,aside').forEach((n: Element) => n.remove());
          const textContent = el.textContent?.trim() || '';
          if (textContent.split(/\s+/).length > 80) return { title, content: el.innerHTML.trim(), textContent };
        }
      } catch { /* continue */ }
    }
  } catch { /* ignore */ }
  return null;
}

/** Lightweight markdown → HTML (no external deps). */
function markdownToHtml(md: string): string {
  return md
    .replace(/^#{6}\s(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s(.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/^(.+)\n={3,}$/gm, '<h1>$1</h1>')
    .replace(/^(.+)\n-{3,}$/gm, '<h2>$1</h2>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---+$/gm, '<hr>')
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|li|blockquote|hr|img|figure|div)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return NextResponse.json({ success: false, error: 'URL required' }, { status: 400 });

  try {
    // 1. Jina AI Reader (works for most non-opted-out sites)
    const jinaResult = await fetchViaJina(url);
    if (jinaResult?.content) {
      return NextResponse.json({
        success: true,
        article: { title: jinaResult.title, content: jinaResult.content, textContent: jinaResult.textContent, byline: null, siteName: null },
      });
    }

    // 2. Wayback Machine (for archived articles)
    const waybackHtml = await fetchViaWayback(url);

    // 3. Direct fetch (works for blogs / sites that don't block cloud IPs)
    const html = waybackHtml || await fetchDirect(url);

    if (!html) {
      return NextResponse.json({ success: false, error: 'Could not retrieve article' }, { status: 502 });
    }

    // Extract content using multiple strategies
    type Result = { title: string; content: string; textContent: string; byline?: string | null; siteName?: string | null };
    let result: Result | null = null;

    const rd = extractWithReadability(html, url);
    if (rd?.content && (rd.textContent || '').split(/\s+/).length > 50) {
      result = { title: rd.title || '', content: rd.content, textContent: rd.textContent || '', byline: rd.byline, siteName: rd.siteName };
    }
    if (!result) {
      const jld = extractFromJsonLd(html);
      if (jld) result = jld;
    }
    if (!result) {
      const fb = extractFallbackContent(html, url);
      if (fb) result = fb;
    }
    if (!result && rd?.content) {
      result = { title: rd.title || '', content: rd.content, textContent: rd.textContent || '', byline: rd.byline, siteName: rd.siteName };
    }

    if (!result?.content) {
      return NextResponse.json({ success: false, error: 'Failed to parse article content' }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      article: { title: result.title, content: result.content, textContent: result.textContent, byline: result.byline || null, siteName: result.siteName || null },
    });

  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError' || error?.message?.includes('abort');
    return NextResponse.json(
      { success: false, error: isTimeout ? 'Request timed out' : 'Failed to fetch article' },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
