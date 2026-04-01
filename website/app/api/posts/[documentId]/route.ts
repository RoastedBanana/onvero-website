import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.from('blogposts').select('*').eq('document_id', documentId).single();

  if (error) {
    return NextResponse.json({ error: 'Beitrag nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json(data);
}
