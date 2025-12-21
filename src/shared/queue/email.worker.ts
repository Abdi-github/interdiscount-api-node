import { Worker, Job } from 'bullmq';
import { queueConnection } from './queue.config';
import { EmailJobData } from './email.queue';
import { sendMail } from '../services/email.service';
import {
  verificationEmail,
  passwordResetEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  pickupReadyEmail,
} from '../services/email.templates';
import logger from '../logger';

/**
 * Process email jobs from the email queue.
 */
const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
  const { data } = job;

  logger.info(`Processing email job: ${data.type}`, { jobId: job.id, to: data.to });

  switch (data.type) {
    case 'verification': {
      const template = verificationEmail(data.firstName, data.verificationToken, data.language);
      await sendMail({ to: data.to, ...template });
      break;
    }

    case 'password_reset': {
      const template = passwordResetEmail(data.firstName, data.resetToken, data.language);
      await sendMail({ to: data.to, ...template });
      break;
    }

    case 'order_confirmation': {
      const template = orderConfirmationEmail(
        data.firstName,
        data.orderNumber,
        data.total,
        data.currency,
        data.isStorePickup,
        data.storeName,
        data.language,
      );
      await sendMail({ to: data.to, ...template });
      break;
    }

    case 'order_status': {
      const template = orderStatusEmail(data.firstName, data.orderNumber, data.status, data.language);
      await sendMail({ to: data.to, ...template });
      break;
    }

    case 'pickup_ready': {
      const template = pickupReadyEmail(data.firstName, data.orderNumber, data.storeName, data.language);
      await sendMail({ to: data.to, ...template });
      break;
    }

    default:
      logger.warn(`Unknown email job type: ${(data as Record<string, unknown>).type}`, { jobId: job.id });
  }
};

/**
 * Start the email worker.
 */
export const startEmailWorker = (): Worker<EmailJobData> => {
  const worker = new Worker<EmailJobData>('email', processEmailJob, {
    connection: queueConnection,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info(`Email job completed: ${job.data.type}`, { jobId: job.id, to: job.data.to });
  });

  worker.on('failed', (job, err) => {
    logger.error(`Email job failed: ${job?.data.type}`, {
      jobId: job?.id,
      to: job?.data.to,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  logger.info('📧 Email worker started');

  return worker;
};
