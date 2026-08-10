/**
 * Rate Limiting Middleware
 *
 * Protects authentication routes from brute force attacks
 * and applies general API rate limiting.
 *
 * SCALING NOTE (Memory Store):
 * Both limiters below use the default in-memory store, which is
 * suitable for single-instance deployments. In a multi-instance /
 * horizontally-scaled environment (e.g. multiple containers behind
 * a load balancer), each instance maintains its own counter, meaning
 * the effective limit is multiplied by the number of instances.
 *
 * For production multi-instance deployments, replace the default store
 * with a shared external store such as:
 *   - `rate-limit-redis`  (recommended)
 *   - `rate-limit-memcached`
 *   - `rate-limit-postgresql`
 *
 * Example with Redis:
 *   import RedisStore from 'rate-limit-redis';
 *   import { createClient } from 'redis';
 *
 *   const redisClient = createClient({ url: process.env.REDIS_URL });
 *   await redisClient.connect();
 *
 *   export const authLimiter = rateLimit({
 *       store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
 *       windowMs: 15 * 60 * 1000,
 *       max: 5,
 *       ...
 *   });
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Integration tests register several users per run, which the 5-per-15-minutes
 * auth limiter would block. `DISABLE_RATE_LIMIT=true` turns the limiters into
 * pass-throughs.
 *
 * Hard-gated on NODE_ENV !== 'production' so the variable cannot disable
 * brute-force protection on a production deployment even if it leaks into the
 * environment there.
 */
const rateLimitDisabled =
    process.env.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true';

if (rateLimitDisabled) {
    console.warn('WARNING: rate limiting is DISABLED (DISABLE_RATE_LIMIT=true, non-production).');
}

const passThrough = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Rate limiter for authentication routes (login, register, forgot-password)
 * Limits: 5 requests per 15 minutes per IP
 *
 * This is intentionally strict to mitigate brute-force and credential
 * stuffing attacks on the most sensitive endpoints.
 */
export const authLimiter = rateLimitDisabled ? passThrough : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 requests per window per IP
    message: {
        error: 'Too many authentication attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * General API rate limiter
 * Limits: 100 requests per minute per IP
 *
 * Applied globally on /api to prevent abuse of any endpoint.
 * Individual routes (e.g. auth) may apply stricter limits on top of this.
 */
export const apiLimiter = rateLimitDisabled ? passThrough : rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Maximum 100 requests per minute
    message: {
        error: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
