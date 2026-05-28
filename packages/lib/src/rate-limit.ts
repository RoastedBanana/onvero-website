import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Upstash Redis Rate Limiter (distributed, works across server instances) ──
// Falls UPSTASH_REDIS_REST_URL nicht gesetzt ist, wird der In-Memory Fallback genutzt.

const useUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// One Upstash limiter per distinct {maxRequests, windowMs} config, lazily created
// and reused. A dedicated Redis key prefix per config keeps counters separate so
// different tiers never share a window.
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const windowSec = Math.ceil(windowMs / 1000);
  const configKey = `${maxRequests}:${windowSec}`;
  let limiter = upstashLimiters.get(configKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
      analytics: false,
      prefix: `rl:${configKey}`,
    });
    upstashLimiters.set(configKey, limiter);
  }
  return limiter;
}

// In-memory fallback
const memStore = new Map<string, { count: number; resetAt: number }>();
if (typeof globalThis !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, val] of memStore) {
        if (val.resetAt < now) memStore.delete(key);
      }
    },
    5 * 60 * 1000
  );
}

export async function rateLimit(
  key: string,
  { maxRequests = 10, windowMs = 60_000 }: { maxRequests?: number; windowMs?: number } = {}
): Promise<{ success: boolean; remaining: number }> {
  if (useUpstash) {
    try {
      const limiter = getUpstashLimiter(maxRequests, windowMs);
      const result = await limiter.limit(key);
      return { success: result.success, remaining: result.remaining };
    } catch {
      // Upstash down — fall through to in-memory
    }
  }

  // In-memory fallback
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }
  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }
  entry.count++;
  return { success: true, remaining: maxRequests - entry.count };
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}
