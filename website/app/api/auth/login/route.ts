import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich.' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? 'Ungültige Anmeldedaten.' },
        { status: 401 }
      );
    }

    // Try to get first/last name from profiles table, fall back to form values
    let profileFirstName = firstName || '';
    let profileLastName = lastName || '';

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      profileFirstName = profile.first_name || firstName || '';
      profileLastName = profile.last_name || lastName || '';
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    // Supabase SSR has already set its own auth cookies via createServerSupabaseClient.
    // We additionally set a user-info cookie for the client UI (no sensitive data).
    const response = NextResponse.json({ success: true });

    response.cookies.set(
      'onvero_user',
      encodeURIComponent(
        JSON.stringify({
          firstName: profileFirstName,
          lastName: profileLastName,
          email: data.user.email || email,
        })
      ),
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge,
        path: '/',
      }
    );

    return response;
  } catch {
    return NextResponse.json({ error: 'Server-Fehler.' }, { status: 500 });
  }
}
