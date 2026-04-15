import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient, isAdmin } from '@/lib/tenant-server';

// ─── DELETE: Remove a team member ────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
    if (!isAdmin(ctx.role))
      return NextResponse.json({ error: 'Nur Admins können Mitglieder entfernen.' }, { status: 403 });

    const { id: userId } = await params;
    const tenantId = ctx.tenantId;

    if (ctx.userId === userId) {
      return NextResponse.json({ error: 'Du kannst dich nicht selbst entfernen.' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Verify the target user is in the same tenant
    const { data: membership } = await admin
      .from('tenant_users')
      .select('user_id, role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Mitglied nicht gefunden.' }, { status: 404 });
    }

    // Remove from tenant_users
    const { error: deleteErr } = await admin
      .from('tenant_users')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (deleteErr) {
      console.error('team DELETE member: failed', deleteErr);
      return NextResponse.json({ error: 'Fehler beim Entfernen.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('team DELETE member error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}

// ─── PATCH: Update member role ───────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
    if (!isAdmin(ctx.role)) return NextResponse.json({ error: 'Nur Admins können Rollen ändern.' }, { status: 403 });

    const { id: userId } = await params;
    const { role } = await req.json();

    if (!role || !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 });
    }

    const tenantId = ctx.tenantId;
    const admin = getAdminClient();

    const { error } = await admin.from('tenant_users').update({ role }).eq('tenant_id', tenantId).eq('user_id', userId);

    if (error) {
      console.error('team PATCH member: failed', error);
      return NextResponse.json({ error: 'Fehler beim Aktualisieren.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('team PATCH member error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}

// ─── POST: Reset member password (admin only) ───────────────────────────────

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
    if (!isAdmin(ctx.role))
      return NextResponse.json({ error: 'Nur Admins können Passwörter zurücksetzen.' }, { status: 403 });

    const { id: userId } = await params;
    const admin = getAdminClient();

    // Verify member is in same tenant
    const { data: membership } = await admin
      .from('tenant_users')
      .select('user_id')
      .eq('tenant_id', ctx.tenantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: 'Mitglied nicht gefunden.' }, { status: 404 });

    // Generate temporary password
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) tempPassword += chars[Math.floor(Math.random() * chars.length)];

    const { error } = await admin.auth.admin.updateUserById(userId, { password: tempPassword });
    if (error) {
      console.error('team POST reset-password: failed', error);
      return NextResponse.json({ error: 'Passwort konnte nicht zurückgesetzt werden.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tempPassword });
  } catch (err) {
    console.error('team POST reset-password error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}
