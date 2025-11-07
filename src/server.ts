import app from './app';
import config from './config';
import connectDatabase from './config/database';
import { connectRedis } from './config/redis';
import { initQueues } from './shared/queue';
import logger from './shared/logger';

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Initialize BullMQ queues and workers
    initQueues();

    // Start Express server
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} [${config.env}]`);
      logger.info(`📡 API: http://localhost:${config.port}/api/${config.apiVersion}`);
      logger.info(`❤️  Health: http://localhost:${config.port}/api/${config.apiVersion}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string): void => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
