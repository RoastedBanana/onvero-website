import { NextRequest, NextResponse } from 'next/server';
import { getSessionTenantId } from '@/lib/tenant-server';

export const dynamic = 'force-dynamic';

// In-memory progress store (per tenant)
const progressMap = new Map<
  string,
  { current_run: number; total_items: number; status: string; company_name?: string; message?: string; updated_at: number }
>();

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

  const progress = progressMap.get(tenantId);
  if (!progress) {
    return NextResponse.json({ current_run: 0, total_items: 0, status: 'waiting' });
  }

  return NextResponse.json(progress);
}

// POST — n8n calls this for each lead update
export async function POST(req: NextRequest) {
  cleanup();

  const body = await req.json();
  const item = Array.isArray(body) ? body[0] : body;

  const tenantId = item.tenant_id;
  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  if (item.status === 'reset') {
    progressMap.delete(tenantId);
    return NextResponse.json({ ok: true });
  }

  if (item.status === 'loop_progress') {
    progressMap.set(tenantId, {
      current_run: item.current_run ?? 0,
      total_items: item.total_items ?? 0,
      status: 'loop_progress',
      company_name: item.company_name,
      message: item.message,
      updated_at: Date.now(),
    });
  } else if (item.status === 'done' || item.status === 'completed') {
    const total = item.total_processed ?? item.total_items ?? item.current_run ?? 0;
    progressMap.set(tenantId, {
      current_run: total,
      total_items: total,
      status: 'done',
      company_name: item.company_name,
      message: item.message,
      updated_at: Date.now(),
    });
  } else {
    // Any other status update
    progressMap.set(tenantId, {
      current_run: item.current_run ?? 0,
      total_items: item.total_items ?? 0,
      status: item.status ?? 'unknown',
      company_name: item.company_name,
      message: item.message,
      updated_at: Date.now(),
    });
  }

  return NextResponse.json({ ok: true });
}
