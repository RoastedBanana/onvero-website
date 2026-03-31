import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get tenant_id for the user
  const { data: tuRow } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();
  if (!tuRow?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 403 });
  const tenantId = tuRow.tenant_id;

  const body = await req.formData();
  const action = body.get('action') as string;
  const title = body.get('title') as string;
  const content = body.get('content') as string;
  const tags = body.get('tags') as string;
  const author = body.get('author') as string;
  const imageFile = body.get('image') as File | null;

  // Upload cover image if provided
  let coverImageUrl: string | null = null;
  let coverImageId: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('blogpost-images')
      .upload(fileName, imageFile, { contentType: imageFile.type, upsert: false });
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from('blogpost-images').getPublicUrl(fileName);
      coverImageUrl = urlData.publicUrl;
      coverImageId = fileName;
    }
  }

  if (action === 'create') {
    const slug = title.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/^-|-$/g, '');
    const { data, error } = await supabase.from('blogposts').insert({
      title,
      content,
      tags,
      writer: author,
      slug,
      cover_image_url: coverImageUrl,
      cover_image_id: coverImageId,
      owner_id: session.user.id,
      tenant_id: tenantId,
      published_date: new Date().toISOString().split('T')[0],
    }).select('id, document_id').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id, documentId: data.document_id });
  }

  if (action === 'update') {
    const documentId = body.get('documentId') as string;
    const existingImageId = body.get('imageId') as string;
    const imageRemoved = body.get('imageRemoved') === 'true';

    // Delete old image if new one uploaded or image was removed
    if ((coverImageUrl || imageRemoved) && existingImageId) {
      await supabase.storage.from('blogpost-images').remove([existingImageId]);
    }

    const updateData: Record<string, unknown> = { title, content, tags, writer: author, updated_at: new Date().toISOString() };
    if (coverImageUrl) {
      updateData.cover_image_url = coverImageUrl;
      updateData.cover_image_id = coverImageId;
    } else if (imageRemoved) {
      updateData.cover_image_url = null;
      updateData.cover_image_id = null;
    }

    const { error } = await supabase.from('blogposts').update(updateData).eq('document_id', documentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
