import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@onvero/lib/tenant-server';

export async function GET(req: NextRequest) {
  const sessionRaw = req.cookies.get('onvero_session')?.value;
  if (!sessionRaw) return NextResponse.json({ user: null });

  let session: { userId?: string; tenantId?: string; role?: string } | null = null;
  try {
    session = JSON.parse(decodeURIComponent(sessionRaw));
  } catch {
    return NextResponse.json({ user: null });
  }

  if (!session?.userId || !session?.tenantId) return NextResponse.json({ user: null });

  // Fresh role from DB — never trust stale cookie role
  const admin = getAdminClient();
  const { data: tu } = await admin
    .from('tenant_users')
    .select('role')
    .eq('user_id', session.userId)
    .eq('tenant_id', session.tenantId)
    .maybeSingle();

  // No tenant_users row = user was removed from team; invalidate session
  if (!tu) return NextResponse.json({ user: null });

  const role = tu.role || 'member';

  // User display info from onvero_user cookie
  const userRaw = req.cookies.get('onvero_user')?.value;
  let displayUser: { firstName?: string; lastName?: string; email?: string } = {};
  if (userRaw) {
    try {
      displayUser = JSON.parse(decodeURIComponent(userRaw));
    } catch {
      // ignore
    }
  }

  // If no display cookie, fall back to auth.users email
  let email = displayUser.email ?? '';
  if (!email) {
    const { data: authUser } = await admin.auth.admin.getUserById(session.userId);
    email = authUser?.user?.email ?? '';
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      tenantId: session.tenantId,
      role,
      firstName: displayUser.firstName ?? '',
      lastName: displayUser.lastName ?? '',
      email,
    },
  });
}
