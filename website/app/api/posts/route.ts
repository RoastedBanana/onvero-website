import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.from('blogposts').select('*').order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Beiträge konnten nicht geladen werden' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
