import { rateLimit, getClientIp } from './rate-limit';

// ─── Central API rate limiting ───────────────────────────────────────────────
// Applied once in each app's proxy.ts (Next.js middleware), so every /api/* route
// is covered automatically — including future ones. Tune the limits below.
//
// NOTE: On Vercel the proxy runs as a distributed function, so the in-memory
// fallback only limits per-instance. Set UPSTASH_REDIS_REST_URL/_TOKEN in prod
// for limits to be enforced consistently across instances.

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  windowMs: number;
  tier: string;
};

type Tier = { name: string; maxRequests: number; windowMs: number };

const MINUTE = 60_000;

// First match wins. Anything unmatched falls through to DEFAULT_TIER.
function tierFor(pathname: string): Tier {
  // Auth — brute-force protection on login.
  if (pathname.startsWith('/api/auth/login')) {
    return { name: 'auth', maxRequests: 10, windowMs: MINUTE };
  }

  // Inbound webhooks from external services (Resend, n8n callbacks). These are
  // signature-verified inside the handler; allow bursts so legitimate callbacks
  // are never dropped.
  if (pathname.startsWith('/api/webhooks/')) {
    return { name: 'webhook-in', maxRequests: 120, windowMs: MINUTE };
  }

  // High-frequency polling / cheap status reads — generous so the UI stays live.
  if (
    pathname.endsWith('/status') ||
    pathname.endsWith('/progress') ||
    pathname.startsWith('/api/notifications') ||
    pathname.startsWith('/api/tenant-quota') ||
    pathname.startsWith('/api/leads/count') ||
    pathname.startsWith('/api/setup/status')
  ) {
    return { name: 'poll', maxRequests: 240, windowMs: MINUTE };
  }

  // Expensive — AI, outbound n8n webhooks, email sending, transcription,
  // enrichment. Kept tight to throttle calls to paid/external services.
  if (
    pathname.startsWith('/api/proxy/') ||
    pathname === '/api/n8n' ||
    pathname.startsWith('/api/n8n/') ||
    pathname.startsWith('/api/generate/') ||
    pathname.startsWith('/api/leads/generate') ||
    pathname.startsWith('/api/leads/ai-rewrite') ||
    pathname.startsWith('/api/leads/rescore') ||
    pathname.startsWith('/api/leads/import') ||
    pathname.startsWith('/api/leads/research-chat') ||
    pathname.startsWith('/api/leads/send-email') ||
    pathname.startsWith('/api/people/rewrite-email') ||
    pathname.startsWith('/api/people/send-email') ||
    pathname.startsWith('/api/profile/analyze-website') ||
    (pathname.startsWith('/api/meetings/') &&
      /(analyze|transcribe|briefing|email-check)/.test(pathname)) ||
    (pathname.startsWith('/api/discovery-runs/') && pathname.endsWith('/launch')) ||
    (pathname.startsWith('/api/networks/') && pathname.endsWith('/expand')) ||
    (pathname.startsWith('/api/absender-profile/') && pathname.endsWith('/generate-template'))
  ) {
    return { name: 'expensive', maxRequests: 20, windowMs: MINUTE };
  }

  return { name: 'default', maxRequests: 120, windowMs: MINUTE };
}

// Per-user when we know who's calling (fairer across shared office IPs),
// otherwise per-IP.
export function rateLimitIdentity(request: Request, userId?: string | null): string {
  return userId ? `u:${userId}` : `ip:${getClientIp(request.headers)}`;
}

export async function checkApiRateLimit(
  pathname: string,
  identity: string
): Promise<RateLimitResult> {
  const tier = tierFor(pathname);
  const { success, remaining } = await rateLimit(`api:${tier.name}:${identity}`, {
    maxRequests: tier.maxRequests,
    windowMs: tier.windowMs,
  });
  return { success, remaining, limit: tier.maxRequests, windowMs: tier.windowMs, tier: tier.name };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'Retry-After': String(Math.ceil(result.windowMs / 1000)),
  };
}
