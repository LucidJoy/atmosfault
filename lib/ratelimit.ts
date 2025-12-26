/**
 * Rate limiting utility using Upstash Redis
 * Implements sliding window rate limiting
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Main rate limiter for API endpoints
 * 30 requests per minute per IP
 */
const mainRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
});

/**
 * Stricter rate limiter for sync endpoint (expensive operation)
 * 5 requests per hour per IP (syncing balloons is resource-intensive)
 */
const syncRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  analytics: true,
});

/**
 * Get client IP address from request headers
 * Handles proxied requests (x-forwarded-for, cf-connecting-ip, etc.)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp) {
    return cloudflareIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "127.0.0.1";
}

/**
 * Check rate limit for main API endpoints (tracking)
 * Returns { success: boolean, remaining: number, resetIn: number }
 */
export async function checkRateLimit(request: Request) {
  const ip = getClientIp(request);
  return await mainRatelimit.limit(ip);
}

/**
 * Check rate limit for sync endpoint (stricter)
 * Returns { success: boolean, remaining: number, resetIn: number }
 */
export async function checkSyncRateLimit(request: Request) {
  const ip = getClientIp(request);
  return await syncRatelimit.limit(ip);
}
