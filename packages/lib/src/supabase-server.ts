import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Set AUTH_COOKIE_DOMAIN=.onvero.de in production so the auth cookie is
// readable by every onvero.de subdomain (sales, website, marketing). Leave
// unset locally (defaults to host-only) so localhost dev works.
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;

/** Use in Server Components, Route Handlers, and Server Actions */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const merged = AUTH_COOKIE_DOMAIN
            ? { ...options, domain: AUTH_COOKIE_DOMAIN }
            : options;
          cookieStore.set(name, value, merged);
        });
      },
    },
  });
}
