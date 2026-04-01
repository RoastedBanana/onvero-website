import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ error: 'Keine Audiodatei empfangen.' }, { status: 400 });
    }

    // ── Step 1: Transcribe via Groq Whisper ──────────────────────────────

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY nicht konfiguriert.' }, { status: 500 });
    }

    // Groq Whisper needs a proper filename with extension
    // MediaRecorder often sends 'blob' or no extension — normalise it
    let fileName = audioFile.name || 'recording';
    if (!/\.\w+$/.test(fileName)) {
      const ext = audioFile.type.includes('webm') ? 'webm'
        : audioFile.type.includes('mp4') || audioFile.type.includes('m4a') ? 'mp4'
        : audioFile.type.includes('ogg') ? 'ogg'
        : audioFile.type.includes('wav') ? 'wav'
        : 'mp3';
      fileName = `${fileName}.${ext}`;
    }

    // Re-create as File with correct name so Groq recognises the format
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type || 'audio/webm' });
    const file = new File([audioBlob], fileName, { type: audioFile.type || 'audio/webm' });

    const whisperForm = new FormData();
    whisperForm.append('file', file, fileName);
    whisperForm.append('model', 'whisper-large-v3');
    whisperForm.append('language', 'de');
    whisperForm.append('response_format', 'text');

    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      const detail = await whisperRes.text().catch(() => 'Unbekannter Fehler');
      return NextResponse.json(
        { error: `Transkription fehlgeschlagen: ${detail}` },
        { status: 502 },
      );
    }

    const transcript = await whisperRes.text();

    // Summary is now triggered separately via the popup buttons
    return NextResponse.json({ transcript });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Interner Serverfehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
