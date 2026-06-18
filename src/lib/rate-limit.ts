// Lightweight fixed-window in-memory rate limiter.
//
// NOTE: state lives in this process only. It protects a single instance well
// (the common case), but a multi-instance/serverless deployment should back this
// with a shared store (e.g. Redis/Upstash) so limits hold across instances.

interface Bucket { count: number; resetAt: number; }

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions { max: number; windowMs: number; }
export interface RateLimitResult { limited: boolean; retryAfterSec: number; remaining: number; }

/** Records a hit for `key` and reports whether it now exceeds `max` within the window. */
export function checkRateLimit(key: string, opts: RateLimitOptions, now: number = Date.now()): RateLimitResult {
    const bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { limited: false, retryAfterSec: 0, remaining: opts.max - 1 };
    }
    bucket.count += 1;
    if (bucket.count > opts.max) {
        return { limited: true, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)), remaining: 0 };
    }
    return { limited: false, retryAfterSec: 0, remaining: opts.max - bucket.count };
}

/** Clears a key — call after a successful login so good users aren't penalised. */
export function resetRateLimit(key: string): void {
    buckets.delete(key);
}

/** Drops expired buckets to bound memory growth. */
export function pruneRateLimits(now: number = Date.now()): void {
    for (const [key, bucket] of buckets) {
        if (now >= bucket.resetAt) buckets.delete(key);
    }
}
