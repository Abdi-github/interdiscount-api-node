import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack, requestId, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const reqId = requestId ? ` [${requestId}]` : '';
  const stackStr = stack ? `\n${stack}` : '';
  return `${ts} [${level}]${reqId} ${message}${metaStr}${stackStr}`;
});

const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  defaultMeta: { service: 'interdiscount-api' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
      zippedArchive: true,
      // Only audit entries
      level: 'info',
    }),
  ],
});

// Don't log to files in test
if (config.isTest) {
  logger.transports.forEach((t) => {
    if (t instanceof DailyRotateFile) {
      t.silent = true;
    }
  });
}

export default logger;
