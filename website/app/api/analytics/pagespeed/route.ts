import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = 'https://onvero.de';
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo`;

    const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: 'PageSpeed unavailable' });

    const data = await res.json();
    const cats = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};

    return NextResponse.json({
      performance: Math.round((cats.performance?.score || 0) * 100),
      seo: Math.round((cats.seo?.score || 0) * 100),
      lcp: audits['largest-contentful-paint']?.displayValue || '—',
      cls: audits['cumulative-layout-shift']?.displayValue || '—',
      fcp: audits['first-contentful-paint']?.displayValue || '—',
      mobile: true,
    });
  } catch {
    return NextResponse.json({ error: 'Failed' });
  }
}
