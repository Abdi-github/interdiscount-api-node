import nodemailer from 'nodemailer';
import config from '../../config';
import logger from '../logger';

/**
 * Nodemailer transport configured for Mailpit (dev) or production SMTP.
 */
const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: false,
  // No auth for Mailpit dev server
  ...(config.isProd
    ? {
        auth: {
          user: process.env.MAIL_USER || '',
          pass: process.env.MAIL_PASS || '',
        },
      }
    : {}),
});

export interface ISendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via the configured transport.
 */
export const sendMail = async (options: ISendMailOptions): Promise<void> => {
  try {
    const info = await transporter.sendMail({
      from: `"Interdiscount" <${config.mail.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info('Email sent', {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
    });
  } catch (error) {
    logger.error('Failed to send email', {
      to: options.to,
      subject: options.subject,
      error,
    });
    throw error;
  }
};

export default transporter;
