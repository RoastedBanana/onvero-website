import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ensureCsrfCookie } from '@/lib/csrf';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and getSession.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Logged-in user visiting /login → send to dashboard
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated user visiting /dashboard/* → send to login
  // Accept either Supabase session OR onvero_user cookie
  const hasOnveroSession = !!request.cookies.get('onvero_user')?.value;
  if (pathname.startsWith('/dashboard') && !session && !hasOnveroSession) {
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
  matcher: ['/login', '/dashboard/:path*', '/api/:path*'],
};
