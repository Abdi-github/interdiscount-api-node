import { Queue } from 'bullmq';
import { queueConnection } from './queue.config';

/**
 * Email job data types.
 */
export interface IVerificationEmailJob {
  type: 'verification';
  to: string;
  firstName: string;
  verificationToken: string;
  language: string;
}

export interface IPasswordResetEmailJob {
  type: 'password_reset';
  to: string;
  firstName: string;
  resetToken: string;
  language: string;
}

export interface IOrderConfirmationEmailJob {
  type: 'order_confirmation';
  to: string;
  firstName: string;
  orderNumber: string;
  total: number;
  currency: string;
  isStorePickup: boolean;
  storeName?: string;
  language: string;
}

export interface IOrderStatusEmailJob {
  type: 'order_status';
  to: string;
  firstName: string;
  orderNumber: string;
  status: string;
  language: string;
}

export interface IPickupReadyEmailJob {
  type: 'pickup_ready';
  to: string;
  firstName: string;
  orderNumber: string;
  storeName: string;
  language: string;
}

export type EmailJobData =
  | IVerificationEmailJob
  | IPasswordResetEmailJob
  | IOrderConfirmationEmailJob
  | IOrderStatusEmailJob
  | IPickupReadyEmailJob;

export const emailQueue = new Queue<EmailJobData>('email', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
