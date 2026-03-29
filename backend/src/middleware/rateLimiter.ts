import type { Context, Next } from 'hono';

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * For production at scale, swap this for a Redis-backed limiter.
 * This implementation is perfectly fine for single-instance deployments.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    // Remove entries that have no recent timestamps
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 15 * 60 * 1000) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Time window in seconds. */
  windowSeconds: number;
  /** Optional key prefix to separate limiters for different routes. */
  keyPrefix?: string;
}

/**
 * Creates a Hono middleware that enforces rate limiting per IP address.
 *
 * @example
 * ```ts
 * app.use('/api/auth/*', rateLimiter({ maxRequests: 20, windowSeconds: 60 }));
 * ```
 */
export function rateLimiter(options: RateLimitOptions) {
  const { maxRequests, windowSeconds, keyPrefix = 'rl' } = options;
  const windowMs = windowSeconds * 1000;

  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    if (entry.timestamps.length >= maxRequests) {
      const oldestInWindow = entry.timestamps[0];
      const retryAfterSec = Math.ceil((oldestInWindow + windowMs - now) / 1000);

      c.header('Retry-After', String(retryAfterSec));
      c.header('X-RateLimit-Limit', String(maxRequests));
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(Math.ceil((oldestInWindow + windowMs) / 1000)));

      return c.json(
        { error: 'Too many requests. Please try again later.' },
        429,
      );
    }

    // Record this request
    entry.timestamps.push(now);

    // Set informational headers
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(maxRequests - entry.timestamps.length));

    await next();
  };
}
