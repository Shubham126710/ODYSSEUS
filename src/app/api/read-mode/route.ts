import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
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
      charThreshold: 50,
    });
    const article = reader.parse();

    if (!article || !article.title) {
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

