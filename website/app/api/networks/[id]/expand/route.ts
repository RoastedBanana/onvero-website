import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WEBHOOK_URL = 'https://n8n.srv1223027.hstgr.cloud/webhook/lead-reasoning';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: networkId } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { node_id, category } = await req.json();
  if (!node_id || !category) return NextResponse.json({ error: 'node_id and category required' }, { status: 400 });

  const supabase = await createServerSupabaseClient();

  // Get the node's lead_id
  const { data: node } = await supabase
    .from('network_nodes')
    .select('lead_id')
    .eq('id', node_id)
    .eq('network_id', networkId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!node?.lead_id) return NextResponse.json({ error: 'Node or lead not found' }, { status: 404 });

  // Fetch the lead's website_data
  const { data: lead } = await supabase
    .from('leads')
    .select('id, company_name, website_data, website_summary, ai_summary')
    .eq('id', node.lead_id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  // Build freetext payload from website_data
  const websiteData = lead.website_data;
  let freetext = '';

  if (typeof websiteData === 'string') {
    freetext = websiteData;
  } else if (websiteData && typeof websiteData === 'object') {
    freetext = JSON.stringify(websiteData, null, 2);
  }

  // Fallback: include summary fields if website_data is empty
  if (!freetext && lead.website_summary) {
    freetext = lead.website_summary;
  }
  if (!freetext && lead.ai_summary) {
    freetext = lead.ai_summary;
  }

  // Send to n8n webhook
  try {
    const webhookRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: lead.id,
        company_name: lead.company_name,
        category,
        network_id: networkId,
        node_id,
        website_data: freetext,
      }),
    });

    const webhookBody = await webhookRes.text();

    return NextResponse.json({
      ok: true,
      webhook_status: webhookRes.status,
      webhook_response: webhookBody,
    });
  } catch (e) {
    return NextResponse.json({ error: `Webhook failed: ${String(e)}` }, { status: 502 });
  }
}
