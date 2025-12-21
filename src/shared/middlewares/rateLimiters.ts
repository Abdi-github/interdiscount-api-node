import rateLimit, { type Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import config from '../../config';
import ApiError from '../errors/ApiError';
import logger from '../logger';

/**
 * Rate limiter factory using Redis store in production and memory store in dev/test.
 *
 * Per-endpoint rate limiters for sensitive operations:
 * - Auth endpoints (login, register): 10 requests / 15 min
 * - Password reset: 5 requests / 15 min
 * - File upload: 20 requests / 15 min
 * - Payment: 10 requests / 15 min
 * - General API: 100 requests / 15 min (default)
 */

let redisClient: Redis | null = null;

const getRedisClient = (): Redis | null => {
  if (config.isTest || config.isDev) return null;
  if (!redisClient) {
    try {
      redisClient = new Redis(config.redis.url, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });
      redisClient.on('error', (err) => {
        logger.warn('Rate limiter Redis error — falling back to memory store', {
          error: err.message,
        });
        redisClient = null;
      });
    } catch {
      logger.warn('Rate limiter Redis connection failed — using memory store');
      return null;
    }
  }
  return redisClient;
};

const createLimiter = (opts: Partial<Options> & { keyPrefix?: string }) => {
  const { keyPrefix, ...rateLimitOpts } = opts;
  const redis = getRedisClient();

  const storeConfig = redis
    ? {
        store: new RedisStore({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sendCommand: (...args: string[]) => (redis as any).call(...args),
          prefix: `rl:${keyPrefix || 'general'}:`,
        }),
      }
    : {};

  return rateLimit({
    windowMs: config.rateLimit.windowMs, // 15 minutes default
    max: config.rateLimit.max, // 100 default
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(ApiError.rateLimited('Too many requests, please try again later'));
    },
    skip: () => config.isTest,
    ...storeConfig,
    ...rateLimitOpts,
  });
};

// ---------------------
// Global limiter (100 req / 15 min)
// ---------------------
export const globalLimiter = createLimiter({
  keyPrefix: 'global',
});

// ---------------------
// Auth limiter (10 req / 15 min) — login, register
// ---------------------
export const authLimiter = createLimiter({
  keyPrefix: 'auth',
  max: 10,
  handler: (_req, _res, next) => {
    next(
      ApiError.rateLimited(
        'Too many authentication attempts. Please try again in 15 minutes.',
      ),
    );
  },
});

// ---------------------
// Password reset limiter (5 req / 15 min)
// ---------------------
export const passwordResetLimiter = createLimiter({
  keyPrefix: 'pwd-reset',
  max: 5,
  handler: (_req, _res, next) => {
    next(
      ApiError.rateLimited(
        'Too many password reset requests. Please try again in 15 minutes.',
      ),
    );
  },
});

// ---------------------
// File upload limiter (20 req / 15 min)
// ---------------------
export const uploadLimiter = createLimiter({
  keyPrefix: 'upload',
  max: 20,
  handler: (_req, _res, next) => {
    next(ApiError.rateLimited('Too many upload requests. Please try again later.'));
  },
});

// ---------------------
// Payment limiter (10 req / 15 min)
// ---------------------
export const paymentLimiter = createLimiter({
  keyPrefix: 'payment',
  max: 10,
  handler: (_req, _res, next) => {
    next(ApiError.rateLimited('Too many payment requests. Please try again later.'));
  },
});

// ---------------------
// Search / autocomplete limiter (30 req / 1 min)
// ---------------------
export const searchLimiter = createLimiter({
  keyPrefix: 'search',
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  handler: (_req, _res, next) => {
    next(ApiError.rateLimited('Too many search requests. Please slow down.'));
  },
});
