import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/contact',
  '/api/chat',
  '/api/favicon',
  '/api/webhooks/resend',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /api/ routes (skip pages, static files, etc.)
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next();

  // Check session cookie
  const session = req.cookies.get('onvero_user');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify cookie is valid JSON
  try {
    JSON.parse(decodeURIComponent(session.value));
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
