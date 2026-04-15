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
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // User can be in multiple tenants — pick the one with the highest role
  const { data: memberships } = await supabase.from('tenant_users').select('tenant_id, role').eq('user_id', user.id);

  if (!memberships || memberships.length === 0) return null;

  // Priority: owner > admin > member
  const priority: Record<string, number> = { owner: 3, admin: 2, member: 1 };
  const best = memberships.sort((a, b) => (priority[b.role] ?? 0) - (priority[a.role] ?? 0))[0];

  return {
    userId: user.id,
    tenantId: best.tenant_id,
    role: (best.role as TenantRole) || 'member',
  };
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
