import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { getSessionTenantId } from '@onvero/lib/tenant-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── POST: Upload meeting recording ────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('audio') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Upload to Supabase Storage
  const fileName = `${tenantId}/${id}/${Date.now()}.webm`;
  const { error: uploadError } = await supabase.storage.from('meeting-recordings').upload(fileName, file, {
    contentType: file.type || 'audio/webm',
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  // Save recording metadata
  const { data, error } = await supabase
    .from('meeting_recordings')
    .insert({
      meeting_id: id,
      tenant_id: tenantId,
      storage_path: fileName,
      file_size_bytes: file.size,
      mime_type: file.type || 'audio/webm',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update meeting status to Abgeschlossen
  await supabase.from('meetings').update({ status: 'Abgeschlossen' }).eq('id', id).eq('tenant_id', tenantId);

  return NextResponse.json({ recording: data }, { status: 201 });
}
