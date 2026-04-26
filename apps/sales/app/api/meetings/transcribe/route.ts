import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@onvero/lib/tenant-server';

// Allow longer execution for large files with multiple chunks
export const maxDuration = 300;

const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB per chunk (under Groq's 25MB limit)

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFileName(audioFile: File): string {
  let fileName = audioFile.name || 'recording';
  if (!/\.\w+$/.test(fileName)) {
    const ext = audioFile.type.includes('webm')
      ? 'webm'
      : audioFile.type.includes('mp4') || audioFile.type.includes('m4a')
        ? 'mp4'
        : audioFile.type.includes('ogg')
          ? 'ogg'
          : audioFile.type.includes('wav')
            ? 'wav'
            : 'mp3';
    fileName = `${fileName}.${ext}`;
  }
  return fileName;
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop() ?? 'mp3';
}

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

async function transcribeChunk(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  groqKey: string,
  format: 'text' | 'verbose_json' = 'text'
): Promise<string | TranscriptSegment[]> {
  const blob = new Blob([buffer], { type: mimeType });
  const file = new File([blob], fileName, { type: mimeType });

  const form = new FormData();
  form.append('file', file, fileName);
  form.append('model', 'whisper-large-v3');
  form.append('language', 'de');
  form.append('response_format', format);

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => 'Unbekannter Fehler');
    throw new Error(`Transkription fehlgeschlagen: ${detail}`);
  }

  if (format === 'verbose_json') {
    const json = await res.json();
    return (json.segments ?? []).map((s: { start: number; end: number; text: string }) => ({
      start: s.start,
      end: s.end,
      text: s.text?.trim() ?? '',
    }));
  }

  return res.text();
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ error: 'Keine Audiodatei empfangen.' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY nicht konfiguriert.' }, { status: 500 });
    }

    const fileName = getFileName(audioFile);
    const mimeType = audioFile.type || 'audio/webm';
    const fullBuffer = await audioFile.arrayBuffer();
    const format =
      (formData.get('format') as string) === 'verbose_json' ? ('verbose_json' as const) : ('text' as const);

    if (fullBuffer.byteLength <= CHUNK_SIZE) {
      // ── Small file: single request ──
      const result = await transcribeChunk(fullBuffer, fileName, mimeType, groqKey, format);
      if (format === 'verbose_json') {
        return NextResponse.json({ segments: result });
      }
      return NextResponse.json({ transcript: result as string });
    }

    // ── Large file: split into chunks and transcribe sequentially ──
    const ext = getExtension(fileName);
    const totalChunks = Math.ceil(fullBuffer.byteLength / CHUNK_SIZE);

    console.log(
      `[transcribe] Splitting ${(fullBuffer.byteLength / 1024 / 1024).toFixed(1)} MB into ${totalChunks} chunks`
    );

    if (format === 'verbose_json') {
      const allSegments: TranscriptSegment[] = [];
      let timeOffset = 0;
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fullBuffer.byteLength);
        const chunk = fullBuffer.slice(start, end);
        const chunkName = `chunk_${i + 1}.${ext}`;
        console.log(`[transcribe] Chunk ${i + 1}/${totalChunks} (${(chunk.byteLength / 1024 / 1024).toFixed(1)} MB)`);
        const segments = (await transcribeChunk(
          chunk,
          chunkName,
          mimeType,
          groqKey,
          'verbose_json'
        )) as TranscriptSegment[];
        for (const seg of segments) {
          allSegments.push({ start: seg.start + timeOffset, end: seg.end + timeOffset, text: seg.text });
        }
        if (segments.length > 0) timeOffset = segments[segments.length - 1].end + timeOffset;
      }
      return NextResponse.json({ segments: allSegments });
    }

    const parts: string[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fullBuffer.byteLength);
      const chunk = fullBuffer.slice(start, end);
      const chunkName = `chunk_${i + 1}.${ext}`;
      console.log(`[transcribe] Chunk ${i + 1}/${totalChunks} (${(chunk.byteLength / 1024 / 1024).toFixed(1)} MB)`);
      const text = (await transcribeChunk(chunk, chunkName, mimeType, groqKey, 'text')) as string;
      if (text.trim()) parts.push(text.trim());
    }

    return NextResponse.json({ transcript: parts.join('\n\n') });
  } catch (err) {
    console.error('[transcribe] Error:', err);
    const message = err instanceof Error ? err.message : 'Interner Serverfehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
