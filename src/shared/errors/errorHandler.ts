import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import ApiError from './ApiError';
import ApiResponse from '../utils/ApiResponse';
import logger from '../logger';
import config from '../../config';

const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  // Already sent headers — delegate to default handler
  if (res.headersSent) {
    _next(err);
    return;
  }

  if (err instanceof ApiError) {
    logger.warn(`API Error [${err.code}]: ${err.message}`, {
      requestId: req.requestId,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      field: err.field,
    });

    ApiResponse.error(res, err.statusCode, err.code, err.message, err.field, err.details);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    logger.warn(`Mongoose Validation Error: ${err.message}`, {
      requestId: req.requestId,
      path: req.path,
    });
    ApiResponse.error(res, 400, 'VALIDATION_ERROR', err.message);
    return;
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as unknown as Record<string, unknown>).code === 11000) {
    const field = Object.keys((err as unknown as Record<string, unknown>).keyValue as object)[0] || 'field';
    logger.warn(`Duplicate key error: ${field}`, {
      requestId: req.requestId,
      path: req.path,
    });
    ApiResponse.error(res, 409, 'CONFLICT', `Duplicate value for ${field}`, field);
    return;
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    logger.warn(`Cast Error: ${err.message}`, {
      requestId: req.requestId,
      path: req.path,
    });
    ApiResponse.error(res, 400, 'VALIDATION_ERROR', 'Invalid ID format');
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    ApiResponse.error(res, 401, 'UNAUTHORIZED', 'Invalid token');
    return;
  }
  if (err.name === 'TokenExpiredError') {
    ApiResponse.error(res, 401, 'UNAUTHORIZED', 'Token expired');
    return;
  }

  // Multer file upload errors
  if (err instanceof MulterError) {
    const multerMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File is too large',
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_FIELD_KEY: 'Field name is too long',
      LIMIT_FIELD_VALUE: 'Field value is too long',
      LIMIT_FIELD_COUNT: 'Too many fields',
      LIMIT_UNEXPECTED_FILE: `Unexpected file field: ${err.field}`,
    };
    logger.warn(`Multer Error [${err.code}]: ${err.message}`, {
      requestId: req.requestId,
      path: req.path,
      field: err.field,
    });
    ApiResponse.error(
      res,
      400,
      'VALIDATION_ERROR',
      multerMessages[err.code] || err.message,
      err.field,
    );
    return;
  }

  // Syntax errors (malformed JSON body)
  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn('Malformed JSON in request body', {
      requestId: req.requestId,
      path: req.path,
    });
    ApiResponse.error(res, 400, 'VALIDATION_ERROR', 'Malformed JSON in request body');
    return;
  }

  // Unexpected error
  logger.error('Unhandled Error:', {
    requestId: req.requestId,
    error: err.message,
    stack: config.isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  ApiResponse.error(
    res,
    500,
    'INTERNAL_ERROR',
    config.isDev ? err.message : 'Internal server error',
  );
};

export default errorHandler;
