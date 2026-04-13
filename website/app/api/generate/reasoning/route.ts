import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch('https://n8n.srv1223027.hstgr.cloud/webhook/lead-reasoning', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-onvero-secret': 'onvero-internal-2024',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  try {
    const data = JSON.parse(text);
    // n8n returns an array — unwrap first element
    const webhook = Array.isArray(data) ? data[0] : data;
    const executionId = webhook.id ?? webhook.execution_id;

    // n8n saves reasoning & strategy to the DB but doesn't return them in the webhook response.
    // Fetch the full row from Supabase to get all fields.
    console.log('[reasoning] executionId:', executionId, 'has admin:', !!getAdmin());
    if (executionId) {
      const admin = getAdmin();
      if (admin) {
        const { data: row, error: dbErr } = await admin
          .from('lead_run_executions')
          .select('*')
          .eq('id', executionId)
          .maybeSingle();

        console.log('[reasoning] DB row found:', !!row, 'error:', dbErr?.message ?? 'none',
          'reasoning:', row?.reasoning?.slice(0, 80) ?? 'NULL',
          'strategy:', row?.strategy?.slice(0, 80) ?? 'NULL');

        if (row) {
          return NextResponse.json({
            ...row,
            execution_id: executionId,
            success: true,
          });
        }
      }
    }

    // Fallback: return webhook response directly
    if (executionId) webhook.execution_id = executionId;
    return NextResponse.json(webhook);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from n8n', raw: text.slice(0, 200) }, { status: 502 });
  }
}
