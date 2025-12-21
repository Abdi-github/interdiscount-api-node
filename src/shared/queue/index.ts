import { emailQueue } from './email.queue';
import { notificationQueue } from './notification.queue';
import { startEmailWorker } from './email.worker';
import { startNotificationWorker } from './notification.worker';
import logger from '../logger';

/**
 * Initialize all BullMQ queues and start workers.
 * Called during server startup after Redis is connected.
 */
export const initQueues = (): void => {
  // Start workers
  startEmailWorker();
  startNotificationWorker();

  logger.info('📬 BullMQ queues initialized', {
    queues: [emailQueue.name, notificationQueue.name],
  });
};

export { emailQueue } from './email.queue';
export { notificationQueue } from './notification.queue';
