import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@/lib/tenant-server';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL erforderlich' }, { status: 400 });
  }

  // Normalize URL
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'OnveroBot/1.0 (+https://onvero.de)' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Website nicht erreichbar (${res.status})` }, { status: 400 });
    }

    const html = await res.text();

    // Extract meta data
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '';
    const metaDesc =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] ||
      '';
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
    const keywords = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';

    // Extract visible text (strip tags, scripts, styles)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyText = bodyMatch?.[1] || html;
    bodyText = bodyText
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    // Extract headings for services/features
    const h2s = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)]
      .map((m) => m[1].trim())
      .filter(Boolean)
      .slice(0, 10);
    const h3s = [...html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/gi)]
      .map((m) => m[1].trim())
      .filter(Boolean)
      .slice(0, 10);

    // Build profile suggestions
    const companyName = ogTitle || title.split(/[|\-–—]/)[0]?.trim() || '';
    const description = ogDesc || metaDesc || '';
    const serviceHints = [...h2s, ...h3s].filter((h) => h.length > 3 && h.length < 80);

    // Try to extract location from structured data
    const locationMatch =
      html.match(/"addressLocality"\s*:\s*"([^"]+)"/i) || html.match(/"addressRegion"\s*:\s*"([^"]+)"/i);
    const location = locationMatch?.[1] || '';

    // Save website_summary to tenant_ai_profile
    const client = getAdminClient();
    await client
      .from('tenant_ai_profile')
      .update({ website_summary: bodyText.slice(0, 2000) })
      .eq('tenant_id', ctx.tenantId);

    return NextResponse.json({
      success: true,
      suggestions: {
        company_name: companyName,
        company_description: description,
        company_location: location,
        website: targetUrl,
        services: serviceHints.slice(0, 5),
        industry: keywords
          .split(',')
          .map((k: string) => k.trim())
          .filter(Boolean)
          .slice(0, 3)
          .join(', '),
      },
      raw: {
        title,
        meta_description: metaDesc,
        og_title: ogTitle,
        og_description: ogDesc,
        keywords,
        headings: serviceHints,
        text_preview: bodyText.slice(0, 500),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: `Website konnte nicht analysiert werden: ${message}` }, { status: 500 });
  }
}
