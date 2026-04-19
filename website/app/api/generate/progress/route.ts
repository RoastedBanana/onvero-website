import { NextRequest, NextResponse } from 'next/server';
import { getSessionTenantId } from '@/lib/tenant-server';

export const dynamic = 'force-dynamic';

// Per-tenant progress: which leads have been scored so far
type ProgressEntry = {
  scored_lead_ids: Set<string>;
  total_items: number;
  last_lead: { company_name?: string; fit_score?: number; is_excluded?: boolean; scored_at?: string } | null;
  updated_at: number;
};

const progressMap = new Map<string, ProgressEntry>();

// Clean up stale entries older than 10 minutes
function cleanup() {
  const now = Date.now();
  for (const [key, val] of progressMap) {
    if (now - val.updated_at > 10 * 60 * 1000) {
      progressMap.delete(key);
    }
  }
}

// GET — frontend polls this for progress
export async function GET() {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entry = progressMap.get(tenantId);
  if (!entry) {
    return NextResponse.json({ scored_count: 0, total_items: 0, status: 'waiting', last_lead: null });
  }

  return NextResponse.json({
    scored_count: entry.scored_lead_ids.size,
    total_items: entry.total_items,
    status: entry.total_items > 0 && entry.scored_lead_ids.size >= entry.total_items ? 'done' : 'in_progress',
    last_lead: entry.last_lead,
  });
}

// POST — n8n calls this for each scored lead (and for reset/start)
export async function POST(req: NextRequest) {
  cleanup();

  const body = await req.json();
  const item = Array.isArray(body) ? body[0] : body;

  const tenantId: string | undefined = item.tenant_id;
  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  // Reset at start of a new run
  if (item.status === 'reset') {
    const total = typeof item.total_items === 'number' ? item.total_items : 0;
    progressMap.set(tenantId, {
      scored_lead_ids: new Set(),
      total_items: total,
      last_lead: null,
      updated_at: Date.now(),
    });
    return NextResponse.json({ ok: true });
  }

  // Get or create entry
  const existing = progressMap.get(tenantId) ?? {
    scored_lead_ids: new Set<string>(),
    total_items: 0,
    last_lead: null,
    updated_at: Date.now(),
  };

  // Individual lead scored
  if (item.status === 'scored' && item.lead_id) {
    existing.scored_lead_ids.add(String(item.lead_id));
    existing.last_lead = {
      company_name: item.company_name,
      fit_score: item.fit_score,
      is_excluded: item.is_excluded,
      scored_at: item.scored_at,
    };
    existing.updated_at = Date.now();
    progressMap.set(tenantId, existing);
    return NextResponse.json({ ok: true, scored_count: existing.scored_lead_ids.size });
  }

  // Update total_items (if n8n sends it separately)
  if (typeof item.total_items === 'number' && item.total_items > 0) {
    existing.total_items = item.total_items;
    existing.updated_at = Date.now();
    progressMap.set(tenantId, existing);
  }

  return NextResponse.json({ ok: true });
}
