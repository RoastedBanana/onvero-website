import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/tenant-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const WEBHOOK_URL = 'https://n8n.srv1223027.hstgr.cloud/webhook/apollo-people-agent';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  let companyName: string | null = body.company_name ?? null;
  let companyDomain: string | null = body.company_domain ?? null;

  // If not provided by the client, look them up from the DB
  if (body.lead_id && (!companyName || !companyDomain)) {
    const cookieStore = await cookies();
    const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll: () => cookieStore.getAll() },
    });
    const { data } = await sb
      .from('leads')
      .select('company_name, primary_domain, website')
      .eq('id', body.lead_id)
      .eq('tenant_id', ctx.tenantId)
      .single();
    if (data) {
      companyName = companyName ?? data.company_name ?? null;
      companyDomain = companyDomain ?? data.primary_domain ?? data.website ?? null;
    }
  }

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_WEBHOOK_SECRET ? { 'x-onvero-secret': process.env.N8N_WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify({
      tenant_id: ctx.tenantId,
      company_name: companyName,
      company_domain: companyDomain,
      lead_id: body.lead_id,
    }),
  });

  const text = await res.text();

  try {
    const data = JSON.parse(text);
    // Response is [{success, persons: [...], ...}]
    const wrapper = Array.isArray(data) ? data[0] : data;
    const persons = wrapper?.persons ?? wrapper?.people ?? wrapper?.contacts ?? [];
    return NextResponse.json({
      persons,
      company_name: wrapper?.company_name ?? null,
      persons_count: wrapper?.persons_count ?? persons.length,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from n8n', raw: text.slice(0, 300) }, { status: 502 });
  }
}
