import { Queue } from 'bullmq';
import { queueConnection } from './queue.config';

/**
 * Notification job data — creates an in-app notification.
 */
export interface INotificationJobData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  /** If true, also send an email notification */
  sendEmail?: boolean;
  /** Email address to send to (required if sendEmail is true) */
  email?: string;
  firstName?: string;
  language?: string;
}

export const notificationQueue = new Queue<INotificationJobData>('notification', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 2000 },
    removeOnFail: { count: 5000 },
  },
});
