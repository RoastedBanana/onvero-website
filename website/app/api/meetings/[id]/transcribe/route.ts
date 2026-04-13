import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CHUNK_SIZE = 20 * 1024 * 1024;

async function transcribeChunk(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  groqKey: string
): Promise<string> {
  const blob = new Blob([buffer], { type: mimeType });
  const file = new File([blob], fileName, { type: mimeType });

  const form = new FormData();
  form.append('file', file, fileName);
  form.append('model', 'whisper-large-v3');
  form.append('language', 'de');
  form.append('response_format', 'text');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => 'Unknown error');
    throw new Error(`Transcription failed: ${detail}`);
  }

  return res.text();
}

// ─── POST: Transcribe meeting recording and save to DB ──────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  const supabase = await createServerSupabaseClient();

  // Check if there's a recording for this meeting
  const { data: recording } = await supabase
    .from('meeting_recordings')
    .select('storage_path, mime_type')
    .eq('meeting_id', id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let fullBuffer: ArrayBuffer;
  let mimeType: string;
  let fileName: string;

  if (recording?.storage_path) {
    // Download from Supabase Storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from('meeting-recordings')
      .download(recording.storage_path);

    if (dlError || !fileData) {
      return NextResponse.json({ error: 'Could not download recording' }, { status: 500 });
    }

    fullBuffer = await fileData.arrayBuffer();
    mimeType = recording.mime_type || 'audio/webm';
    fileName = recording.storage_path.split('/').pop() || 'recording.webm';
  } else {
    // Fallback: accept audio from request body
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ error: 'No recording found and no audio provided' }, { status: 400 });
    }

    fullBuffer = await audioFile.arrayBuffer();
    mimeType = audioFile.type || 'audio/webm';
    fileName = audioFile.name || 'recording.webm';
  }

  // Transcribe
  let transcript: string;

  if (fullBuffer.byteLength <= CHUNK_SIZE) {
    transcript = await transcribeChunk(fullBuffer, fileName, mimeType, groqKey);
  } else {
    const ext = fileName.split('.').pop() ?? 'webm';
    const totalChunks = Math.ceil(fullBuffer.byteLength / CHUNK_SIZE);
    const parts: string[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fullBuffer.byteLength);
      const chunk = fullBuffer.slice(start, end);
      const text = await transcribeChunk(chunk, `chunk_${i + 1}.${ext}`, mimeType, groqKey);
      if (text.trim()) parts.push(text.trim());
    }

    transcript = parts.join('\n\n');
  }

  // Save transcript to DB
  const { data: saved, error: saveError } = await supabase
    .from('meeting_transcripts')
    .upsert(
      {
        meeting_id: id,
        tenant_id: tenantId,
        transcript,
        language: 'de',
        provider: 'groq',
      },
      { onConflict: 'meeting_id' }
    )
    .select()
    .single();

  if (saveError) {
    // Transcript was created but save failed — return transcript anyway
    return NextResponse.json({ transcript, saved: false, error: saveError.message });
  }

  return NextResponse.json({ transcript, saved: true, id: saved.id });
}
