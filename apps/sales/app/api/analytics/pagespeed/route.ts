import { NextResponse } from 'next/server';
import { getSessionContext } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = 'https://onvero.de';

  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'OnveroBusinessOS/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const duration = Date.now() - start;
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

    const hasTitle = !!titleMatch;
    const hasDescription = !!descMatch;
    const hasOgImage = !!ogImageMatch;
    const hasViewport = html.includes('name="viewport"') || html.includes("name='viewport'");
    const hasHttps = url.startsWith('https');

    const checks = [hasTitle, hasDescription, hasOgImage, hasViewport, hasHttps, res.ok];
    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    const speed = duration < 1000 ? 'Schnell' : duration < 3000 ? 'Mittel' : 'Langsam';
    const speedScore = duration < 1000 ? 90 : duration < 2000 ? 70 : duration < 3000 ? 50 : 30;

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      loadTime: duration,
      loadTimeFormatted: `${(duration / 1000).toFixed(2)}s`,
      speed,
      speedScore,
      seoScore: score,
      title: titleMatch?.[1]?.trim() || null,
      description: descMatch?.[1]?.trim() || null,
      hasOgImage,
      isResponsive: hasViewport,
      hasHttps,
      checks: {
        title: hasTitle,
        description: hasDescription,
        ogImage: hasOgImage,
        viewport: hasViewport,
        https: hasHttps,
        online: res.ok,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed', loadTime: 0, speed: '—', speedScore: 0, seoScore: 0 });
  }
}
