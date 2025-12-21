import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import ApiError from '../errors/ApiError';

/**
 * Validate request using a Zod schema.
 * Schema should define body/query/params as top-level keys.
 * Parsed body is written back to req.body.
 * Parsed query/params are stored on req._validated for controllers to use.
 */
const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as Record<string, unknown>;

      // Write back parsed body (body is writable)
      if (data.body) req.body = data.body;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues: ZodIssue[] = error.issues;
        const firstError = issues[0];
        const field = firstError.path.join('.');
        const details = {
          errors: issues.map((e: ZodIssue) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        };
        next(ApiError.badRequest(firstError.message, field, details));
        return;
      }
      next(error);
    }
  };
};

export default validate;
