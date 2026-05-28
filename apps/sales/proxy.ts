import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ensureCsrfCookie } from '@onvero/lib/csrf';
import {
  checkApiRateLimit,
  rateLimitIdentity,
  rateLimitHeaders,
} from '@onvero/lib/api-rate-limit';

// ─── FAST AUTH CHECK — cookie-only, no Supabase network calls ───────────────
// The old approach called supabase.auth.getSession() on EVERY request which
// made a network call to Supabase. When Supabase was slow or the connection
// died, the ENTIRE server hung and no pages could load.
//
// New approach: check the onvero_session cookie directly. This is the SINGLE
// source of truth for the sales app — set by /api/auth/login, validated by
// /api/auth/me and getSessionContext. We must NOT also accept a Supabase
// `-auth-token` cookie here: a stale sb cookie (left by the /dashboard browser
// client or the .onvero.de-wide website auth) would make this proxy think the
// user is logged in while /api/auth/me returns null — an infinite redirect
// loop (/login → /intelligence → me:null → logout → /login → …) that logout
// can never break, since logout only clears onvero_session.

export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // Validate cookie structure — broken/corrupted cookies are not treated as valid
  const raw = request.cookies.get('onvero_session')?.value;
  let hasOnveroSession = false;
  let onveroUserId: string | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      hasOnveroSession = !!(parsed.userId && parsed.tenantId);
      if (hasOnveroSession) onveroUserId = parsed.userId;
    } catch {
      hasOnveroSession = false;
    }
  }

  const isLoggedIn = hasOnveroSession;

  // Root or login → send logged-in users straight to dashboard
  if ((pathname === '/' || pathname === '/login') && isLoggedIn) {
    return NextResponse.redirect(new URL('/intelligence', request.url));
  }

  // Unauthenticated root → send to login
  if (pathname === '/' && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Unauthenticated user visiting protected routes → send to login
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/intelligence');
  if (isProtected && !isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Protect API routes (except public ones)
  if (pathname.startsWith('/api/')) {
    // Rate limit every API route — runs before the auth check so login brute
    // force is throttled too. Keyed per user when logged in, else per IP.
    const rl = await checkApiRateLimit(pathname, rateLimitIdentity(request, onveroUserId));
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte einen Moment warten.' },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

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
      // '/api/profile',  // protected — requires session
      '/api/people',
      '/api/tenant-quota',
      '/api/sales/',
    ];
    const isPublic = PUBLIC_API.some((r) => pathname.startsWith(r));
    if (!isPublic && !isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return ensureCsrfCookie(request, supabaseResponse);
}

export const config = {
  matcher: ['/login', '/join', '/dashboard/:path*', '/intelligence/:path*', '/api/:path*'],
};
