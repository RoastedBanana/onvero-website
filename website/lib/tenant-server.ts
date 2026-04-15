import { createServerSupabaseClient } from './supabase-server';
import { createClient } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TenantRole = 'owner' | 'admin' | 'member';

export interface SessionContext {
  userId: string;
  tenantId: string;
  role: TenantRole;
}

// ─── Admin client (bypasses RLS) ─────────────────────────────────────────────

export function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// ─── Session helpers ─────────────────────────────────────────────────────────

/**
 * Resolves the full session context: userId, tenantId, and role.
 * Returns null if no session or no tenant membership.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  try {
    const supabase = await createServerSupabaseClient();

    // Try getUser first (validates JWT with Supabase)
    let userId: string | null = null;

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userData?.user) {
      userId = userData.user.id;
    } else {
      // Fallback: try getSession (reads from cookie without network call)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        userId = sessionData.session.user.id;
      }
    }

    if (!userId) {
      console.error('[getSessionContext] no user', userErr?.message);
      return null;
    }

    // Use admin client to bypass RLS for tenant lookup
    const admin = getAdminClient();
    const { data: memberships } = await admin.from('tenant_users').select('tenant_id, role').eq('user_id', userId);

    if (!memberships || memberships.length === 0) {
      console.error('[getSessionContext] no tenant_users for userId', userId);
      return null;
    }

    // Priority: owner > admin > member
    const priority: Record<string, number> = { owner: 3, admin: 2, member: 1 };
    const best = memberships.sort((a, b) => (priority[b.role] ?? 0) - (priority[a.role] ?? 0))[0];

    return {
      userId,
      tenantId: best.tenant_id,
      role: (best.role as TenantRole) || 'member',
    };
  } catch (err) {
    console.error('[getSessionContext] error:', err);
    return null;
  }
}

/**
 * Shortcut: just get tenant_id (backwards compatible).
 */
export async function getSessionTenantId(): Promise<string | null> {
  const ctx = await getSessionContext();
  return ctx?.tenantId ?? null;
}

/**
 * Check if current user has admin-level access (owner or admin).
 */
export function isAdmin(role: TenantRole): boolean {
  return role === 'owner' || role === 'admin';
}
