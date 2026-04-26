import { NextRequest, NextResponse } from 'next/server';
import { getSessionTenantId } from '@/lib/tenant-server';

export const dynamic = 'force-dynamic';

// Per-tenant progress: which leads have been scored so far
type ScoredLead = {
  lead_id: string;
  company_name?: string;
  fit_score?: number;
  is_excluded?: boolean;
  scored_at?: string;
};

type ProgressEntry = {
  scored_lead_ids: Set<string>;
  scored_leads: ScoredLead[]; // ordered (newest last), de-duplicated
  total_items: number;
  started_at: number;
  updated_at: number;
};

const progressMap = new Map<string, ProgressEntry>();

// Clean up stale entries older than 30 minutes
function cleanup() {
  const now = Date.now();
  for (const [key, val] of progressMap) {
    if (now - val.updated_at > 30 * 60 * 1000) {
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
    return NextResponse.json({
      scored_count: 0,
      total_items: 0,
      status: 'waiting',
      scored_leads: [],
      started_at: null,
    });
  }

  const done = entry.total_items > 0 && entry.scored_lead_ids.size >= entry.total_items;
  return NextResponse.json({
    scored_count: entry.scored_lead_ids.size,
    total_items: entry.total_items,
    status: done ? 'done' : 'in_progress',
    scored_leads: entry.scored_leads,
    last_lead: entry.scored_leads[entry.scored_leads.length - 1] ?? null,
    started_at: new Date(entry.started_at).toISOString(),
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
      scored_leads: [],
      total_items: total,
      started_at: Date.now(),
      updated_at: Date.now(),
    });
    return NextResponse.json({ ok: true });
  }

  // Get or create entry
  const existing = progressMap.get(tenantId) ?? {
    scored_lead_ids: new Set<string>(),
    scored_leads: [] as ScoredLead[],
    total_items: 0,
    started_at: Date.now(),
    updated_at: Date.now(),
  };

  // Accept both new "event: lead_scored" and legacy "status: scored"
  const isScoredEvent =
    item.event === 'lead_scored' || item.status === 'scored';

  if (isScoredEvent && item.lead_id) {
    const id = String(item.lead_id);
    if (!existing.scored_lead_ids.has(id)) {
      existing.scored_lead_ids.add(id);
      existing.scored_leads.push({
        lead_id: id,
        company_name: item.company_name,
        fit_score: typeof item.fit_score === 'number' ? item.fit_score : undefined,
        is_excluded: item.is_excluded,
        scored_at: item.scored_at ?? new Date().toISOString(),
      });
    }
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
