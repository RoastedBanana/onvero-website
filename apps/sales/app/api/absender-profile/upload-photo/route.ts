import { NextRequest, NextResponse } from 'next/server';
import { getSalesSessionContext, getAdminClient } from '@/lib/session';

export const dynamic = 'force-dynamic';

const BUCKET = 'sender-photos';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

export async function POST(req: NextRequest) {
  const ctx = await getSalesSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'No form data' }, { status: 400 });

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu groß (max 5 MB)' }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Nur PNG, JPG, WEBP oder GIF erlaubt' }, { status: 400 });
  }

  const ext = extFromMime(file.type);
  const key = `${ctx.tenantId}/${crypto.randomUUID()}.${ext}`;

  const admin = getAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(key);
  return NextResponse.json({ url: pub.publicUrl, path: key });
}
