import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const TENANT = 'df763f85-c687-42d6-be66-a2b353b89c90';
  const body = await req.json();

  const { data, error } = await supabase
    .from('leads')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('lead_activities').insert({
    lead_id: id,
    tenant_id: TENANT,
    type: 'status_change',
    title: `Status geandert zu: ${body.status}`,
    content: 'Manuell über Analytics Dashboard geaendert',
    metadata: { new_status: body.status, changed_via: 'analytics_dashboard' },
  });

  return NextResponse.json({ lead: data });
}
