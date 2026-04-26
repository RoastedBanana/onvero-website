import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie-only auth check — no Supabase network call per request.
// Real validation happens inside API routes via supabase.auth.getUser().
function hasSupabaseSession(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();
  return cookies.some((c) => c.name.includes('-auth-token') && c.value.length > 10);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = hasSupabaseSession(request);
  const hasOnveroSession = !!request.cookies.get('onvero_user')?.value;
  const isLoggedIn = hasSession || hasOnveroSession;

  // Logged-in user visiting /login → send to dashboard
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated user visiting /dashboard → send to login
  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Protect non-public API routes
  if (pathname.startsWith('/api/')) {
    const PUBLIC_API = ['/api/auth/'];
    const isPublic = PUBLIC_API.some((r) => pathname.startsWith(r));
    if (!isPublic && !isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/api/:path*'],
};
