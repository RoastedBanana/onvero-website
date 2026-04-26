export const PLAUSIBLE_SITE_ID = 'onvero.de';
const PLAUSIBLE_V2 = 'https://plausible.io/api/v2/query';

interface V2Result {
  metrics: number[];
  dimensions: string[];
}

async function queryV2(
  apiKey: string,
  body: Record<string, unknown>
): Promise<{ results: V2Result[]; query: Record<string, unknown> } | null> {
  const res = await fetch(PLAUSIBLE_V2, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ site_id: PLAUSIBLE_SITE_ID, ...body }),
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function plausibleStats(
  metrics: string[],
  period: string,
  apiKey: string
): Promise<Record<string, { value: number }> | null> {
  const dateRange = periodToRange(period);
  const data = await queryV2(apiKey, { metrics, date_range: dateRange });
  if (!data?.results?.[0]) return null;
  const values = data.results[0].metrics;
  const result: Record<string, { value: number }> = {};
  metrics.forEach((m, i) => {
    result[m] = { value: values[i] ?? 0 };
  });
  return result;
}

export async function plausibleTimeseries(
  metric: string,
  period: string,
  apiKey: string
): Promise<{ date: string; [key: string]: string | number }[]> {
  const dateRange = periodToRange(period);
  const data = await queryV2(apiKey, {
    metrics: [metric],
    date_range: dateRange,
    dimensions: ['time:day'],
  });
  if (!data?.results) return [];
  return data.results.map((r) => ({
    date: r.dimensions[0],
    [metric]: r.metrics[0] ?? 0,
  }));
}

export async function plausibleBreakdown(
  property: string,
  period: string,
  apiKey: string,
  limit = 10
): Promise<{ [key: string]: string | number }[]> {
  const dateRange = periodToRange(period);
  const metrics = ['visitors', 'pageviews', 'bounce_rate'];
  const dimension = property.startsWith('visit:') ? property : `visit:${property}`;
  const data = await queryV2(apiKey, {
    metrics,
    date_range: dateRange,
    dimensions: [dimension],
    pagination: { offset: 0, limit },
  });
  if (!data?.results) return [];
  return data.results.map((r) => {
    const obj: Record<string, string | number> = {};
    obj[property.replace('visit:', '')] = r.dimensions[0];
    metrics.forEach((m, i) => {
      obj[m] = r.metrics[i] ?? 0;
    });
    return obj;
  });
}

function periodToRange(period: string): string {
  // Map v1 periods to v2 date_range values
  switch (period) {
    case 'day':
      return 'day';
    case '7d':
      return '7d';
    case '30d':
      return '30d';
    case 'month':
      return 'month';
    case '6mo':
      return '6mo';
    case '12mo':
      return '12mo';
    default:
      return period;
  }
}
