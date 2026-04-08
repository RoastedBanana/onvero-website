import { createServerSupabaseClient } from './supabase-server';

/**
 * Resolves the tenant_id of the currently logged-in user from the
 * tenant_users join table. Returns null if there is no session or
 * the user has no tenant membership.
 *
 * Use this in API route handlers instead of hardcoding a tenant id.
 */
export async function getSessionTenantId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.tenant_id ?? null;
}
