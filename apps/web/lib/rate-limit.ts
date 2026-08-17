// Simple in-memory rate limiter for development
// For production, use @upstash/ratelimit with Redis

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Check if entry exists and is still valid
  if (entry && entry.resetTime > now) {
    if (entry.count >= maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }
    entry.count++;
    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Create new entry
  const resetTime = now + windowMs;
  rateLimitStore.set(key, { count: 1, resetTime });

  // Cleanup old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime <= now) {
        rateLimitStore.delete(k);
      }
    }
  }

  return {
    success: true,
    remaining: maxRequests - 1,
    resetTime,
  };
}
