import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

const N8N_WEBHOOK = process.env.N8N_WEBHOOK_BLOG!;

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
