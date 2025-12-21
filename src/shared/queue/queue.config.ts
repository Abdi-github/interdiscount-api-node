import { ConnectionOptions } from 'bullmq';
import config from '../../config';

/**
 * BullMQ requires a separate Redis connection with maxRetriesPerRequest: null.
 * This cannot share the ioredis client used for caching.
 */
const parseRedisUrl = (url: string): ConnectionOptions => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    maxRetriesPerRequest: null,
  };
};

export const queueConnection: ConnectionOptions = parseRedisUrl(config.redis.url);
