import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@onvero/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ user: null });
  }

  const raw = req.cookies.get('onvero_user')?.value;
  if (raw) {
    try {
      const user = JSON.parse(decodeURIComponent(raw));
      return NextResponse.json({ user });
    } catch {
      // fall through
    }
  }

  return NextResponse.json({
    user: {
      email: authUser.email,
      firstName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || '',
      lastName: '',
    },
  });
}
