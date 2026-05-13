import { createServerSupabaseClient } from "./supabase-server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TenantRole = "owner" | "admin" | "member";

export interface SessionContext {
  userId: string;
  tenantId: string;
  role: TenantRole;
}

// ─── Admin client (bypasses RLS) ─────────────────────────────────────────────

export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Session helpers ─────────────────────────────────────────────────────────

/**
 * Resolves the full session context: userId, tenantId, and role.
 *
 * Tries the lightweight onvero_session cookie first (set by the sales app
 * login route). Falls back to Supabase JWT validation for apps that still
 * use the old auth flow (e.g. apps/website).
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  try {
    // ── Primary: onvero_session cookie (sales app cookie-based auth) ──────
    const cookieStore = await cookies();
    const raw = cookieStore.get("onvero_session")?.value;
    if (raw) {
      const parsed = JSON.parse(decodeURIComponent(raw)) as {
        userId?: string;
        tenantId?: string;
        role?: string;
      };
      if (parsed.userId && parsed.tenantId) {
        // Always verify role from DB — cookie role can be stale after role changes
        const admin = getAdminClient();
        const { data: tu } = await admin
          .from("tenant_users")
          .select("role")
          .eq("user_id", parsed.userId)
          .eq("tenant_id", parsed.tenantId)
          .maybeSingle();

        // No row in tenant_users = user was removed; treat session as invalid
        if (!tu) return null;

        return {
          userId: parsed.userId,
          tenantId: parsed.tenantId,
          role: (tu.role as TenantRole) ?? "member",
        };
      }
    }

    // ── Fallback: Supabase JWT (apps/website and other SSR-auth apps) ─────
    const supabase = await createServerSupabaseClient();

    let userId: string | null = null;

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userData?.user) {
      userId = userData.user.id;
    } else {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        userId = sessionData.session.user.id;
      }
    }

    if (!userId) {
      console.error("[getSessionContext] no user", userErr?.message);
      return null;
    }

    const admin = getAdminClient();
    const { data: memberships } = await admin
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", userId);

    if (!memberships || memberships.length === 0) {
      console.error("[getSessionContext] no tenant_users for userId", userId);
      return null;
    }

    const priority: Record<string, number> = { owner: 3, admin: 2, member: 1 };
    const best = memberships.sort(
      (a, b) => (priority[b.role] ?? 0) - (priority[a.role] ?? 0),
    )[0];

    return {
      userId,
      tenantId: best.tenant_id,
      role: (best.role as TenantRole) || "member",
    };
  } catch (err) {
    console.error("[getSessionContext] error:", err);
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
  return role === "owner" || role === "admin";
}
