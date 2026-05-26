import { NextRequest, NextResponse } from 'next/server';
import { getSalesSessionContext } from '@/lib/session';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 512 * 1024; // 512 KB — emails are tiny

function parseEml(raw: string): { subject: string; body: string } {
  // Minimal RFC822 split: headers up to first blank line, then body.
  const sepMatch = raw.match(/\r?\n\r?\n/);
  if (!sepMatch || sepMatch.index === undefined) {
    return { subject: '', body: raw.trim() };
  }
  const headers = raw.slice(0, sepMatch.index);
  const body = raw.slice(sepMatch.index + sepMatch[0].length).trim();

  let subject = '';
  const subjectMatch = headers.match(/^Subject:\s*(.+?)(?:\r?\n(?![ \t])|$)/im);
  if (subjectMatch) subject = subjectMatch[1].trim();

  return { subject, body };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Datei zu groß (max 512 KB)' }, { status: 400 });
  }

  const raw = await file.text();
  const name = file.name.toLowerCase();

  let subject = '';
  let body = '';

  if (name.endsWith('.eml')) {
    const parsed = parseEml(raw);
    subject = parsed.subject;
    body = parsed.body.startsWith('<') ? stripHtml(parsed.body) : parsed.body;
  } else if (name.endsWith('.html') || name.endsWith('.htm')) {
    body = stripHtml(raw);
  } else {
    // .txt or anything else: treat first non-empty line as subject if it's short
    const lines = raw.split(/\r?\n/);
    const firstNonEmpty = lines.find((l) => l.trim().length > 0) ?? '';
    if (firstNonEmpty.length <= 120 && lines.length > 1) {
      subject = firstNonEmpty.trim();
      body = lines.slice(lines.indexOf(firstNonEmpty) + 1).join('\n').trim();
    } else {
      body = raw.trim();
    }
  }

  return NextResponse.json({
    template: {
      name: file.name.replace(/\.(eml|html|htm|txt)$/i, ''),
      subject,
      body,
      source: 'uploaded' as const,
    },
  });
}
