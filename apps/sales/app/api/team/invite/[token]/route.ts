import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient, isAdmin } from '@onvero/lib/tenant-server';

// ─── DELETE: Revoke a pending invitation ─────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
    if (!isAdmin(ctx.role))
      return NextResponse.json({ error: 'Nur Admins können Einladungen widerrufen.' }, { status: 403 });

    const tenantId = ctx.tenantId;
    const { token } = await params;
    const admin = getAdminClient();

    // Verify invitation belongs to this tenant and is still pending
    const { data: invite } = await admin
      .from('invitations')
      .select('token, tenant_id, used_at')
      .eq('token', token)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ error: 'Einladung nicht gefunden.' }, { status: 404 });
    }

    if (invite.used_at) {
      return NextResponse.json({ error: 'Einladung wurde bereits angenommen.' }, { status: 410 });
    }

    // Delete the invitation
    const { error } = await admin.from('invitations').delete().eq('token', token).eq('tenant_id', tenantId);

    if (error) {
      console.error('team DELETE invite: failed', error);
      return NextResponse.json({ error: 'Fehler beim Widerrufen.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('team DELETE invite error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}
