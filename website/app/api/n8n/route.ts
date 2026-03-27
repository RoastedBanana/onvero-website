import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

const N8N_WEBHOOK = 'https://n8n.srv1223027.hstgr.cloud/webhook/faf398bf-4e13-4fff-b3c2-b1cb3d8b9390';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.formData();
  body.append('jwt', session.access_token);

  const res = await fetch(N8N_WEBHOOK, {
    method: 'POST',
    body,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}
