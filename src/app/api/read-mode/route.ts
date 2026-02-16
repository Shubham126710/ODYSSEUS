import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
  }

  try {
    // Dynamically import to avoid bundling issues on serverless
    const { JSDOM } = await import('jsdom');
    const { Readability } = await import('@mozilla/readability');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': new URL(url).origin,
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'DNT': '1',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
      return NextResponse.json({ success: false, error: `Failed to fetch article: ${response.status}` }, { status: 502 });
    }

    const html = await response.text();

    if (!html || html.length < 100) {
      return NextResponse.json({ success: false, error: 'Empty or invalid response from source' }, { status: 422 });
    }
    
    // Remove style, script, and link tags to avoid jsdom parsing errors and reduce overhead
    const htmlCleaned = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<link[^>]*>/gi, '');
    
    const dom = new JSDOM(htmlCleaned, { url });
    const reader = new Readability(dom.window.document, {
      charThreshold: 100,
    });
    const article = reader.parse();

    if (!article || !article.content) {
      console.error(`Readability failed to parse content for ${url}`);
      return NextResponse.json({ success: false, error: 'Failed to parse article content' }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      article: {
        title: article.title,
        content: article.content,
        textContent: article.textContent,
        byline: article.byline,
        siteName: article.siteName,
      }
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
