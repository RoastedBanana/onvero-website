import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient, isAdmin } from '@/lib/tenant-server';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(ctx.role)) return NextResponse.json({ error: 'Nur Admins' }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get('logo') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Keine Datei' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Datei zu groß (max 5MB)' }, { status: 400 });
  }

  const client = getAdminClient();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const fileName = `logos/${ctx.tenantId}/${crypto.randomUUID()}.${ext}`;

  // Delete old logo if exists
  const { data: existing } = await client
    .from('tenant_integrations')
    .select('logo_url')
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle();

  if (existing?.logo_url) {
    const oldPath = existing.logo_url.split('/website-assets/')[1];
    if (oldPath) await client.storage.from('website-assets').remove([oldPath]);
  }

  // Upload new
  const buffer = await file.arrayBuffer();
  const { error: uploadErr } = await client.storage
    .from('website-assets')
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadErr) {
    return NextResponse.json({ error: 'Upload fehlgeschlagen: ' + uploadErr.message }, { status: 500 });
  }

  const { data: urlData } = client.storage.from('website-assets').getPublicUrl(fileName);
  const url = urlData.publicUrl;

  // Save to both tables
  await client
    .from('tenant_preferences')
    .upsert(
      { tenant_id: ctx.tenantId, logo_url: url, updated_at: new Date().toISOString() },
      { onConflict: 'tenant_id' }
    );

  await client
    .from('tenant_integrations')
    .update({ logo_url: url, updated_at: new Date().toISOString() })
    .eq('tenant_id', ctx.tenantId);

  return NextResponse.json({ success: true, logo_url: url });
}

export async function DELETE() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(ctx.role)) return NextResponse.json({ error: 'Nur Admins' }, { status: 403 });

  const client = getAdminClient();

  const { data: existing } = await client
    .from('tenant_integrations')
    .select('logo_url')
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle();

  if (existing?.logo_url) {
    const oldPath = existing.logo_url.split('/website-assets/')[1];
    if (oldPath) await client.storage.from('website-assets').remove([oldPath]);
  }

  await client.from('tenant_preferences').update({ logo_url: null }).eq('tenant_id', ctx.tenantId);
  await client.from('tenant_integrations').update({ logo_url: null }).eq('tenant_id', ctx.tenantId);

  return NextResponse.json({ success: true });
}
