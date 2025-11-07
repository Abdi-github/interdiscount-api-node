import Redis from 'ioredis';
import config from './index';
import logger from '../shared/logger';

let redisClient: Redis | null = null;

const connectRedis = async (): Promise<Redis> => {
  try {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    await redisClient.connect();

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export { connectRedis, getRedisClient };
