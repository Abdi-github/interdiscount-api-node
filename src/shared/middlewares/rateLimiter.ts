import rateLimit from 'express-rate-limit';
import config from '../../config';
import ApiError from '../errors/ApiError';

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.rateLimited('Too many requests, please try again later'));
  },
  skip: () => config.isTest,
});

export default rateLimiter;
