import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';

// Latest live status row for the in-flight research request (set by n8n).
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ status: null }, { status: 401 });

  const leadId = new URL(req.url).searchParams.get('leadId')?.trim();
  if (!leadId) return NextResponse.json({ status: null }, { status: 400 });

  const sessionId = `lead-${leadId}-${ctx.userId}`;
  const admin = getAdminClient();
  const { data } = await admin
    .from('lead_chat_status')
    .select('status, tool_name, details, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1);

  return NextResponse.json({ status: data?.[0] ?? null });
}
