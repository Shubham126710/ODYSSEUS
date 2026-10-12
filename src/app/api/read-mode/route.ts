import { NextResponse } from 'next/server';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { purifyExtractedArticle } from '@/lib/cleanArticleExtraction';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Virtual console to silence CSS stylesheet parsing warnings
const virtualConsole = new VirtualConsole();
virtualConsole.on('error', () => {});
virtualConsole.on('warn', () => {});

// ---------------------------------------------------------------------------
// Fetch strategies
// ---------------------------------------------------------------------------

/** Direct fetch — works for most publishers (Guardian, Verge, BBC, etc.) with zero proxy overhead. */
async function fetchDirect(url: string): Promise<string | null> {
  const headerSets: Record<string, string>[] = [
    {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Referer': 'https://www.google.com/',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
    },
    {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  ];

  for (const h of headerSets) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
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

/** Jina AI Reader — handles JS-heavy SPAs and sites that block direct server IPs. */
async function fetchViaJina(url: string): Promise<{ title: string; content: string; textContent: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'application/json', 'X-Timeout': '7' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code && data.code !== 200) return null;

    const article = data?.data;
    if (!article?.content || article.content.length < 200) return null;

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

/** Proxy fetch — bypasses IP blocks using a public proxy. */
async function fetchViaProxy(url: string): Promise<string | null> {
  try {
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(corsProxyUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 500) return text;
    }
  } catch { /* ignore */ }

  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.contents && data.contents.length > 500) {
        return data.contents;
      }
    }
  } catch { /* ignore */ }
  return null;
}

/** Internet Archive Wayback Machine — last resort for 404 / dead articles. */
async function fetchViaWayback(url: string): Promise<string | null> {
  try {
    const availRes = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!availRes.ok) return null;
    const avail = await availRes.json();
    const snapshotUrl: string | undefined = avail?.archived_snapshots?.closest?.url;
    if (!snapshotUrl) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
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

// ---------------------------------------------------------------------------
// Content extraction
// ---------------------------------------------------------------------------

function extractWithReadability(html: string, url: string) {
  try {
    // Strip styles and external stylesheets before JSDOM to prevent heavy CSS parsing overhead
    const cleanHtml = html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');

    const dom = new JSDOM(cleanHtml, { url, virtualConsole });
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
    const dom = new JSDOM(html, { url, virtualConsole });
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

function extractFromHtml(html: string, url: string): { title: string; content: string; textContent: string; byline?: string | null; siteName?: string | null } | null {
  const rd = extractWithReadability(html, url);
  if (rd?.content && (rd.textContent || '').split(/\s+/).length > 80) {
    return { title: rd.title || '', content: rd.content, textContent: rd.textContent || '', byline: rd.byline, siteName: rd.siteName };
  }
  const jld = extractFromJsonLd(html);
  if (jld && jld.textContent.split(/\s+/).length > 80) {
    return jld;
  }
  const fb = extractFallbackContent(html, url);
  if (fb && fb.textContent.split(/\s+/).length > 80) {
    return fb;
  }
  if (rd?.content) {
    return { title: rd.title || '', content: rd.content, textContent: rd.textContent || '', byline: rd.byline, siteName: rd.siteName };
  }
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
    type ArticleResult = { title: string; content: string; textContent: string; byline?: string | null; siteName?: string | null };
    let extracted: ArticleResult | null = null;

    // 1. Direct fetch with real browser headers (Fastest: ~300-600ms, accurate live HTML)
    const directHtml = await fetchDirect(url);
    if (directHtml) {
      extracted = extractFromHtml(directHtml, url);
    }

    // 2. Jina AI Reader (handles JavaScript-heavy SPAs, Substack, and sites that block server IPs)
    if (!extracted || extracted.textContent.split(/\s+/).length < 80) {
      const jinaResult = await fetchViaJina(url);
      if (jinaResult?.content && jinaResult.textContent.split(/\s+/).length >= 80) {
        extracted = jinaResult;
      }
    }

    // 3. Proxy fetch fallback
    if (!extracted || extracted.textContent.split(/\s+/).length < 80) {
      const proxyHtml = await fetchViaProxy(url);
      if (proxyHtml) {
        const proxyExtracted = extractFromHtml(proxyHtml, url);
        if (proxyExtracted && proxyExtracted.textContent.split(/\s+/).length >= 80) {
          extracted = proxyExtracted;
        }
      }
    }

    // 4. Wayback Machine (last resort for 404 / dead articles)
    if (!extracted || extracted.textContent.split(/\s+/).length < 80) {
      const waybackHtml = await fetchViaWayback(url);
      if (waybackHtml) {
        const wbExtracted = extractFromHtml(waybackHtml, url);
        if (wbExtracted && wbExtracted.textContent.split(/\s+/).length >= 80) {
          extracted = wbExtracted;
        }
      }
    }

    if (!extracted?.content) {
      return NextResponse.json({ success: false, error: 'Failed to parse article content' }, { status: 422 });
    }

    const purified = purifyExtractedArticle({
      title: extracted.title,
      content: extracted.content,
      url,
    });

    return NextResponse.json({
      success: true,
      article: {
        title: purified.title,
        content: purified.cleanHtml,
        textContent: purified.plainText,
        readTime: purified.readTime,
        wordCount: purified.wordCount,
        byline: extracted.byline || null,
        siteName: extracted.siteName || null,
      },
    });

  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError' || error?.message?.includes('abort');
    return NextResponse.json(
      { success: false, error: isTimeout ? 'Request timed out' : 'Failed to fetch article' },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
