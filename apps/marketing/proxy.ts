import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ensureCsrfCookie } from '@/lib/csrf';

export async function proxy(request: NextRequest) {
  return ensureCsrfCookie(request, NextResponse.next({ request }));
}

export const config = {
  matcher: ['/api/:path*'],
};
