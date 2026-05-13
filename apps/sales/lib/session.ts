import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export type TenantRole = 'owner' | 'admin' | 'member';

export interface SessionContext {
  userId: string;
  tenantId: string;
  role: TenantRole;
}

export function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

/**
 * Reads session from the onvero_session cookie set at login.
 * userId/tenantId come from the cookie; role is always verified fresh from DB
 * so stale cookies never block legitimate access after role changes.
 */
export async function getSalesSessionContext(): Promise<SessionContext | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('onvero_session')?.value;
    if (!raw) return null;

    const parsed = JSON.parse(decodeURIComponent(raw)) as {
      userId?: string;
      tenantId?: string;
      role?: string;
    };

    if (!parsed.userId || !parsed.tenantId) return null;

    // Fresh role from DB — cookie role can be stale after role changes
    const admin = getAdminClient();
    const { data: tu } = await admin
      .from('tenant_users')
      .select('role')
      .eq('user_id', parsed.userId)
      .eq('tenant_id', parsed.tenantId)
      .maybeSingle();

    // No row in tenant_users = user was removed; treat session as invalid
    if (!tu) return null;

    return {
      userId: parsed.userId,
      tenantId: parsed.tenantId,
      role: (tu.role as TenantRole) ?? 'member',
    };
  } catch {
    return null;
  }
}
