export const PLAUSIBLE_SITE_ID = 'onvero.de';
export const PLAUSIBLE_BASE = 'https://plausible.io/api/v1';

export async function plausibleStats(metrics: string[], period: string, apiKey: string) {
  const url = new URL(`${PLAUSIBLE_BASE}/stats/aggregate`);
  url.searchParams.set('site_id', PLAUSIBLE_SITE_ID);
  url.searchParams.set('period', period);
  url.searchParams.set('metrics', metrics.join(','));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results;
}

export async function plausibleTimeseries(metric: string, period: string, apiKey: string) {
  const url = new URL(`${PLAUSIBLE_BASE}/stats/timeseries`);
  url.searchParams.set('site_id', PLAUSIBLE_SITE_ID);
  url.searchParams.set('period', period);
  url.searchParams.set('metrics', metric);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function plausibleBreakdown(property: string, period: string, apiKey: string, limit = 10) {
  const url = new URL(`${PLAUSIBLE_BASE}/stats/breakdown`);
  url.searchParams.set('site_id', PLAUSIBLE_SITE_ID);
  url.searchParams.set('period', period);
  url.searchParams.set('property', property);
  url.searchParams.set('metrics', 'visitors,pageviews,bounce_rate');
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}
