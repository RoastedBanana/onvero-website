import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@/lib/tenant-server';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL erforderlich' }, { status: 400 });
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;

  try {
    // Follow redirects explicitly
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OnveroBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Website nicht erreichbar (${res.status})` }, { status: 400 });
    }

    const html = await res.text();

    // If we got a tiny "Redirecting..." page, try the final URL
    if (html.length < 200 && html.includes('Redirect')) {
      const metaRefresh = html.match(/url=["']?([^"'\s>]+)/i);
      if (metaRefresh) {
        const redirectUrl = new URL(metaRefresh[1], targetUrl).href;
        const res2 = await fetch(redirectUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnveroBot/1.0)', Accept: 'text/html' },
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
        });
        if (res2.ok) {
          const html2 = await res2.text();
          return analyzeHtml(html2, targetUrl, ctx.tenantId);
        }
      }
    }

    return analyzeHtml(html, targetUrl, ctx.tenantId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: `Website konnte nicht analysiert werden: ${message}` }, { status: 500 });
  }
}

async function analyzeHtml(html: string, targetUrl: string, tenantId: string) {
  // ── Extract meta tags ──
  // Get the LAST/main <title>, skip SVG titles
  const titles = [...html.matchAll(/<title[^>]*>([^<]+)<\/title>/gi)]
    .map((m) => m[1].trim())
    .filter((t) => t.length > 3 && !t.includes('Background') && !t.includes('Icon'));
  const title = titles[0] || '';

  const metaDesc = extractMeta(html, 'description');
  const ogTitle = extractMeta(html, 'og:title', true);
  const ogDesc = extractMeta(html, 'og:description', true);
  const ogSiteName = extractMeta(html, 'og:site_name', true);
  const keywords = extractMeta(html, 'keywords');

  // ── Extract headings (strip HTML tags inside headings) ──
  const h2s = extractHeadings(html, 'h2');
  const h3s = extractHeadings(html, 'h3');
  const h1s = extractHeadings(html, 'h1');

  // ── Extract visible body text ──
  let bodyText = html;
  bodyText = bodyText.replace(/<script[\s\S]*?<\/script>/gi, '');
  bodyText = bodyText.replace(/<style[\s\S]*?<\/style>/gi, '');
  bodyText = bodyText.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  bodyText = bodyText.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  bodyText = bodyText.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  bodyText = bodyText.replace(/<[^>]+>/g, ' ');
  bodyText = bodyText
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');
  bodyText = bodyText.replace(/\s+/g, ' ').trim().slice(0, 5000);

  // ── Build suggestions ──
  const companyName = ogSiteName || ogTitle || title.split(/[|\-–—]/)[0]?.trim() || '';
  const description = ogDesc || metaDesc || '';

  // Services: h3s that look like product/service names (short, no "Kontakt", "FAQ" etc)
  const skipWords = [
    'kontakt',
    'faq',
    'impressum',
    'datenschutz',
    'erstgespräch',
    'konzept',
    'umsetzung',
    'noch fragen',
    'cookie',
  ];
  const services = [...h3s, ...h2s]
    .filter((h) => h.length > 3 && h.length < 60)
    .filter((h) => !skipWords.some((sw) => h.toLowerCase().includes(sw)))
    .filter((h, i, arr) => arr.indexOf(h) === i) // deduplicate
    .slice(0, 8);

  // Location from structured data or text
  const location =
    html.match(/"addressLocality"\s*:\s*"([^"]+)"/i)?.[1] ||
    html.match(/"addressRegion"\s*:\s*"([^"]+)"/i)?.[1] ||
    html.match(/"addressCountry"\s*:\s*"([^"]+)"/i)?.[1] ||
    '';

  // Industry from keywords or og:type
  const industry = keywords
    ? keywords
        .split(',')
        .map((k: string) => k.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(', ')
    : '';

  // USP: first h1 or prominent heading
  const usp = h1s[0] || h2s[0] || '';

  // Save summary
  const client = getAdminClient();
  await client
    .from('tenant_ai_profile')
    .update({ website_summary: bodyText.slice(0, 2000) })
    .eq('tenant_id', tenantId);

  return NextResponse.json({
    success: true,
    suggestions: {
      company_name: companyName,
      company_description: description,
      company_location: location,
      website: targetUrl,
      services,
      industry,
      usp,
    },
  });
}

function extractMeta(html: string, name: string, isProperty = false): string {
  const attr = isProperty ? 'property' : 'name';
  const re1 = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${name}["']`, 'i');
  return html.match(re1)?.[1] || html.match(re2)?.[1] || '';
}

function extractHeadings(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  return [...html.matchAll(re)]
    .map((m) =>
      m[1]
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter((h) => h.length > 2 && h.length < 100)
    .filter((h, i, arr) => arr.indexOf(h) === i) // deduplicate
    .slice(0, 15);
}
