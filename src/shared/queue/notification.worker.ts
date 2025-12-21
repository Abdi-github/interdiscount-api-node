import { Worker, Job } from 'bullmq';
import { queueConnection } from './queue.config';
import { INotificationJobData } from './notification.queue';
import Notification from '../../modules/notifications/notification.model';
import logger from '../logger';

/**
 * Process notification jobs — creates in-app notifications.
 */
const processNotificationJob = async (job: Job<INotificationJobData>): Promise<void> => {
  const { data } = job;

  logger.info(`Processing notification job: ${data.type}`, {
    jobId: job.id,
    userId: data.user_id,
  });

  // Create in-app notification
  await Notification.create({
    user_id: data.user_id,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data || null,
    is_read: false,
  });

  logger.info('In-app notification created', {
    userId: data.user_id,
    type: data.type,
  });
};

/**
 * Start the notification worker.
 */
export const startNotificationWorker = (): Worker<INotificationJobData> => {
  const worker = new Worker<INotificationJobData>('notification', processNotificationJob, {
    connection: queueConnection,
    concurrency: 10,
  });

  worker.on('completed', (job) => {
    logger.info(`Notification job completed: ${job.data.type}`, {
      jobId: job.id,
      userId: job.data.user_id,
    });
  });

  worker.on('failed', (job, err) => {
    logger.error(`Notification job failed: ${job?.data.type}`, {
      jobId: job?.id,
      userId: job?.data.user_id,
      error: err.message,
    });
  });

  logger.info('🔔 Notification worker started');

  return worker;
};
