import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ success: true });
  response.cookies.delete('onvero_user');
  return response;
}
