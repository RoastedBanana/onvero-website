import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');

  if (!domain || domain.length < 3) {
    return new NextResponse(null, { status: 400 });
  }

  const sources = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) continue;

      const buffer = await res.arrayBuffer();

      if (buffer.byteLength < 100) continue;

      const contentType = res.headers.get('content-type') ?? 'image/x-icon';

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

  return new NextResponse(null, { status: 404 });
}
