import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE = 'onvero_csrf';
const CSRF_HEADER = 'x-csrf-token';

/** Generate a random CSRF token */
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token using double-submit cookie pattern.
 * The client must send the same token in both:
 * - Cookie: onvero_csrf
 * - Header: x-csrf-token
 */
export function validateCsrf(req: NextRequest): boolean {
  // Skip for GET/HEAD/OPTIONS — they're safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;

  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

/**
 * Set CSRF cookie on response if not already present.
 * Call this in API routes that serve pages (or in middleware).
 */
export function ensureCsrfCookie(req: NextRequest, res: NextResponse): NextResponse {
  const existing = req.cookies.get(CSRF_COOKIE)?.value;
  if (!existing) {
    const token = generateToken();
    res.cookies.set(CSRF_COOKIE, token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }
  return res;
}

/** Helper: get CSRF token from cookie (client-side) */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/onvero_csrf=([^;]+)/);
  return match ? match[1] : '';
}
