import { NextRequest, NextResponse } from 'next/server';

// In-memory cache to avoid re-fetching the same domain
const cache = new Map<string, { buffer: ArrayBuffer; contentType: string; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const failCache = new Set<string>();

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');

  if (!domain || domain.length < 3) {
    return new NextResponse(null, { status: 400 });
  }

  // Return from memory cache if available
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new NextResponse(cached.buffer, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Skip domains we already know fail
  if (failCache.has(domain)) {
    return new NextResponse(null, { status: 404 });
  }

  const sources = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://${domain}/favicon.ico`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000),
        redirect: 'follow',
      });

      if (!res.ok) continue;

      const buffer = await res.arrayBuffer();

      // Skip tiny/empty responses
      if (buffer.byteLength < 100) continue;

      const contentType = res.headers.get('content-type') ?? 'image/x-icon';

      // Store in memory cache
      cache.set(domain, { buffer, contentType, ts: Date.now() });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      continue;
    }
  }

  failCache.add(domain);
  return new NextResponse(null, { status: 404 });
}
