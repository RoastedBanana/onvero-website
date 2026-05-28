import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ensureCsrfCookie } from '@onvero/lib/csrf';
import {
  checkApiRateLimit,
  rateLimitIdentity,
  rateLimitHeaders,
} from '@onvero/lib/api-rate-limit';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit every API route (per IP).
  if (pathname.startsWith('/api/')) {
    const rl = await checkApiRateLimit(pathname, rateLimitIdentity(request));
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte einen Moment warten.' },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }
  }

  return ensureCsrfCookie(request, NextResponse.next({ request }));
}

export const config = {
  matcher: ['/api/:path*'],
};
