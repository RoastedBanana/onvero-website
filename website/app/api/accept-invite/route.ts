import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { token, password, displayName } = await req.json();

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Token und Passwort (min. 8 Zeichen) erforderlich.' }, { status: 400 });
    }

    // Re-validate token server-side
    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .select('email, tenant_id, used_at, expires_at, role')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      console.error('accept-invite: invite lookup failed', inviteError);
      return NextResponse.json({ error: 'Einladung nicht gefunden.' }, { status: 404 });
    }

    if (invite.used_at) {
      return NextResponse.json({ error: 'Dieser Link wurde bereits verwendet.' }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Dieser Link ist abgelaufen.' }, { status: 410 });
    }

    // Try to create new user, or find existing one
    let userId: string;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || invite.email.split('@')[0],
      },
    });

    if (authError && authError.message?.includes('already been registered')) {
      // User exists — look them up and update their password
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === invite.email);
      if (!existing) {
        return NextResponse.json({ error: 'Benutzer existiert, konnte aber nicht gefunden werden.' }, { status: 500 });
      }
      userId = existing.id;

      // Update password so the invited user can log in with the new password
      await supabase.auth.admin.updateUserById(userId, {
        password,
        user_metadata: {
          display_name: displayName || existing.user_metadata?.display_name || invite.email.split('@')[0],
        },
      });
    } else if (authError || !authData?.user) {
      console.error('accept-invite: auth.admin.createUser failed', authError);
      return NextResponse.json(
        { error: authError?.message || 'Benutzer konnte nicht erstellt werden.' },
        { status: 500 }
      );
    } else {
      userId = authData.user.id;
    }

    // Check if already in this tenant
    const { data: existingMembership } = await supabase
      .from('tenant_users')
      .select('user_id')
      .eq('tenant_id', invite.tenant_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMembership) {
      // Already a member — just mark invite as used
      await supabase.from('invitations').update({ used_at: new Date().toISOString() }).eq('token', token);
      return NextResponse.json({ success: true, email: invite.email, tenant_id: invite.tenant_id });
    }

    // Insert into tenant_users
    const { error: tenantError } = await supabase.from('tenant_users').insert({
      tenant_id: invite.tenant_id,
      user_id: userId,
      role: invite.role || 'member',
      invited_at: new Date().toISOString(),
    });

    if (tenantError) {
      console.error('accept-invite: tenant_users insert failed', tenantError);
      return NextResponse.json({ error: 'Fehler beim Zuweisen des Teams.' }, { status: 500 });
    }

    // Mark invitation as used
    await supabase.from('invitations').update({ used_at: new Date().toISOString() }).eq('token', token);

    return NextResponse.json({
      success: true,
      email: invite.email,
      tenant_id: invite.tenant_id,
    });
  } catch (err) {
    console.error('accept-invite error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}
