import { Router } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../../shared/utils/asyncHandler';
import ApiResponse from '../../shared/utils/ApiResponse';
import logger from '../../shared/logger';

const router = Router();

// GET /api/v1/health
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    ApiResponse.success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    }, 'API is healthy');
  }),
);

// GET /api/v1/health/db
router.get(
  '/db',
  asyncHandler(async (_req, res) => {
    const state = mongoose.connection.readyState;
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    if (state !== 1) {
      logger.warn('Database health check failed', { state: states[state] });
      ApiResponse.error(res, 503, 'SERVICE_UNAVAILABLE', 'Database is not connected');
      return;
    }

    // Ping the database
    await mongoose.connection.db!.admin().ping();

    ApiResponse.success(res, {
      status: 'connected',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    }, 'Database is healthy');
  }),
);

// GET /api/v1/health/redis
router.get(
  '/redis',
  asyncHandler(async (_req, res) => {
    try {
      const { getRedisClient } = await import('../../config/redis');
      const client = getRedisClient();
      const pong = await client.ping();

      ApiResponse.success(res, {
        status: pong === 'PONG' ? 'connected' : 'unknown',
      }, 'Redis is healthy');
    } catch (error) {
      logger.warn('Redis health check failed', { error });
      ApiResponse.error(res, 503, 'SERVICE_UNAVAILABLE', 'Redis is not connected');
    }
  }),
);

// GET /api/v1/health/queues
router.get(
  '/queues',
  asyncHandler(async (_req, res) => {
    try {
      const { emailQueue, notificationQueue } = await import('../../shared/queue');
      const [emailWaiting, emailActive, notifWaiting, notifActive] = await Promise.all([
        emailQueue.getWaitingCount(),
        emailQueue.getActiveCount(),
        notificationQueue.getWaitingCount(),
        notificationQueue.getActiveCount(),
      ]);

      ApiResponse.success(res, {
        status: 'ok',
        queues: {
          email: { waiting: emailWaiting, active: emailActive },
          notification: { waiting: notifWaiting, active: notifActive },
        },
      }, 'Queues are healthy');
    } catch (error) {
      logger.warn('Queue health check failed', { error });
      ApiResponse.error(res, 503, 'SERVICE_UNAVAILABLE', 'Queue system is not available');
    }
  }),
);

export default router;
