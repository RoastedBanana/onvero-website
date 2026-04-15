import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getSessionTenantId, getAdminClient, isAdmin } from '@/lib/tenant-server';

const getAdmin = getAdminClient;

// ─── GET: List team members + pending invitations ────────────────────────────

export async function GET() {
  try {
    const tenantId = await getSessionTenantId();
    if (!tenantId) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

    const admin = getAdmin();

    // Fetch members: tenant_users joined with auth.users metadata
    const { data: memberships, error: mErr } = await admin
      .from('tenant_users')
      .select('user_id, role, invited_at')
      .eq('tenant_id', tenantId);

    if (mErr) {
      console.error('team GET: tenant_users query failed', mErr);
      return NextResponse.json({ error: 'Fehler beim Laden der Mitglieder.' }, { status: 500 });
    }

    // Fetch user details from auth.users for each member
    const members = await Promise.all(
      (memberships ?? []).map(async (m) => {
        const { data } = await admin.auth.admin.getUserById(m.user_id);
        const u = data?.user;
        return {
          id: m.user_id,
          email: u?.email ?? '',
          name: u?.user_metadata?.display_name ?? u?.email?.split('@')[0] ?? '',
          role: m.role ?? 'member',
          invited_at: m.invited_at,
          last_sign_in: u?.last_sign_in_at ?? null,
        };
      })
    );

    // Fetch pending invitations
    const { data: invites, error: iErr } = await admin
      .from('invitations')
      .select('token, email, role, created_at, expires_at, used_at')
      .eq('tenant_id', tenantId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (iErr) {
      console.error('team GET: invitations query failed', iErr);
    }

    return NextResponse.json({
      members: members.sort((a, b) => (a.role === 'admin' ? -1 : 1) - (b.role === 'admin' ? -1 : 1)),
      invitations: (invites ?? []).map((inv) => ({
        token: inv.token,
        email: inv.email,
        role: inv.role ?? 'member',
        created_at: inv.created_at,
        expires_at: inv.expires_at,
      })),
    });
  } catch (err) {
    console.error('team GET error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}

// ─── POST: Create invitation ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
    }
    if (!isAdmin(ctx.role)) {
      return NextResponse.json({ error: 'Nur Admins können Mitglieder einladen.' }, { status: 403 });
    }
    const tenantId = ctx.tenantId;

    const body = await req.json();
    const email = body?.email?.trim()?.toLowerCase();
    const name = body?.name?.trim() || null;
    const role = body?.role;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Gültige E-Mail-Adresse erforderlich.' }, { status: 400 });
    }

    const inviteRole = role === 'admin' ? 'admin' : 'member';
    const admin = getAdmin();

    // Check team size
    const { data: existingUsers, error: teamErr } = await admin
      .from('tenant_users')
      .select('user_id')
      .eq('tenant_id', tenantId);

    if (teamErr) {
      console.error('team POST: team size check failed', teamErr);
      return NextResponse.json({ error: 'Fehler beim Prüfen der Team-Größe.' }, { status: 500 });
    }

    if (existingUsers && existingUsers.length >= 10) {
      return NextResponse.json({ error: 'Maximale Team-Größe erreicht (10 Mitglieder).' }, { status: 400 });
    }

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await admin
      .from('invitations')
      .select('token')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json({ error: 'Es gibt bereits eine offene Einladung für diese E-Mail.' }, { status: 409 });
    }

    // Let DB generate the token (uuid default) and insert
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: inserted, error: insertErr } = await admin
      .from('invitations')
      .insert({
        email,
        role: inviteRole,
        tenant_id: tenantId,
        expires_at: expiresAt.toISOString(),
        name,
      })
      .select('token')
      .single();

    if (insertErr || !inserted) {
      console.error('team POST: invitation insert failed', insertErr);
      return NextResponse.json(
        { error: 'Einladung konnte nicht erstellt werden: ' + (insertErr?.message || 'unbekannt') },
        { status: 500 }
      );
    }

    // Build the invite link
    const baseUrl = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || '';
    const inviteLink = `${baseUrl}/join?token=${inserted.token}`;

    return NextResponse.json({
      success: true,
      token: inserted.token,
      invite_link: inviteLink,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('team POST error:', err);
    return NextResponse.json(
      { error: 'Interner Fehler: ' + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}
