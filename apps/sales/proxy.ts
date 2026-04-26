import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ensureCsrfCookie } from '@/lib/csrf';

// ─── FAST AUTH CHECK — cookie-only, no Supabase network calls ───────────────
// The old approach called supabase.auth.getSession() on EVERY request which
// made a network call to Supabase. When Supabase was slow or the connection
// died, the ENTIRE server hung and no pages could load.
//
// New approach: check for auth cookies directly. The Supabase client stores
// session tokens in cookies — we just check if they exist. Actual token
// validation happens client-side or in API routes that need it.

function hasSupabaseSession(request: NextRequest): boolean {
  // Supabase stores auth in cookies like sb-<ref>-auth-token
  const cookies = request.cookies.getAll();
  return cookies.some((c) => c.name.includes('-auth-token') && c.value.length > 10);
}

export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const hasSession = hasSupabaseSession(request);
  const hasOnveroSession = !!request.cookies.get('onvero_user')?.value;
  const isLoggedIn = hasSession || hasOnveroSession;

  // Logged-in user visiting /login → send to dashboard
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated user visiting protected routes → send to login
  const isProtected = pathname.startsWith('/dashboard');
  if (isProtected && !isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Protect API routes (except public ones)
  if (pathname.startsWith('/api/')) {
    const PUBLIC_API = [
      '/api/auth/',
      '/api/contact',
      '/api/chat',
      '/api/favicon',
      '/api/webhooks/resend',
      '/api/validate-invite',
      '/api/accept-invite',
      '/api/generate/',
      '/api/leads',
      '/api/lead-generator-runs',
      '/api/analytics',
      '/api/profile',
      '/api/people',
      '/api/tenant-quota',
      '/api/sales/',
    ];
    const isPublic = PUBLIC_API.some((r) => pathname.startsWith(r));
    if (!isPublic) {
      const sessionCookie = request.cookies.get('onvero_user');
      if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      try {
        JSON.parse(decodeURIComponent(sessionCookie.value));
      } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
    }
  }

  return ensureCsrfCookie(request, supabaseResponse);
}

export const config = {
  matcher: ['/login', '/join', '/dashboard/:path*', '/api/:path*'],
};
