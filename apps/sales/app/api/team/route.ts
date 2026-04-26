import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getSessionTenantId, getAdminClient, isAdmin } from '@onvero/lib/tenant-server';

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
    const inviteRole = body?.role === 'admin' ? 'admin' : 'member';
    const admin = getAdmin();

    // Check team size (members + pending invites)
    const { data: existingUsers } = await admin.from('tenant_users').select('user_id').eq('tenant_id', tenantId);

    const { data: pendingInvites } = await admin
      .from('invitations')
      .select('token')
      .eq('tenant_id', tenantId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString());

    const totalSlots = (existingUsers?.length ?? 0) + (pendingInvites?.length ?? 0);
    if (totalSlots >= 10) {
      return NextResponse.json({ error: 'Maximale Team-Größe erreicht (10 Mitglieder).' }, { status: 400 });
    }

    // Create invite link (no email needed — person enters their own data)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: inserted, error: insertErr } = await admin
      .from('invitations')
      .insert({
        email: 'pending',
        role: inviteRole,
        tenant_id: tenantId,
        expires_at: expiresAt.toISOString(),
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
