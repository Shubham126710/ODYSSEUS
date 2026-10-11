import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Reusable Edge Image Proxy with CDN Hotlink Bypass, Fallback & Long-Term Caching
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing image URL parameter', { status: 400 });
  }

  // Clean unescaped entities
  targetUrl = targetUrl.replace(/&amp;/g, '&').trim();

  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return new NextResponse('Invalid protocol', { status: 400 });
    }

    // SSRF defense
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.endsWith('.local')
    ) {
      return new NextResponse('Forbidden target', { status: 403 });
    }

    // 1. First attempt: Direct fetch with browser headers & origin referer
    try {
      const upstreamHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': `${parsed.origin}/`,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(targetUrl, {
        headers: upstreamHeaders,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch {
      // Direct fetch failed or timed out — proceed to CDN fallback
    }

    // 2. High-res Edge CDN Fallback (wsrv.nl handles Cloudflare & anti-hotlinking transparently)
    try {
      const fallbackUrl = `https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}&output=webp&q=85`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Odysseus/1.0',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (fallbackRes.ok) {
        const fbBuffer = await fallbackRes.arrayBuffer();
        const fbContentType = fallbackRes.headers.get('content-type') || 'image/webp';

        return new NextResponse(fbBuffer, {
          status: 200,
          headers: {
            'Content-Type': fbContentType,
            'Cache-Control': 'public, max-age=604800, s-maxage=1209600, stale-while-revalidate=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch {
      // fallback failed
    }

    return new NextResponse('Image fetch failed across upstream and edge fallback', { status: 502 });
  } catch (error) {
    return new NextResponse('Invalid URL parameter', { status: 400 });
  }
}
