import hpp from 'hpp';
import { Router, type Request, type Response, type NextFunction } from 'express';

/**
 * Input sanitization middleware stack.
 *
 * 1. Custom NoSQL injection prevention — strips keys starting with `$` or containing `.`
 *    from req.body and req.params. Sanitizes req.query values in-place (without
 *    reassigning the property, which is read-only in Node 22 + Express 5).
 *
 * 2. hpp — protects against HTTP Parameter Pollution.
 */
const sanitizeRouter = Router();

// ─── Recursively sanitize an object IN-PLACE (no reassignment) ───────────────
function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      console.warn(`[SANITIZE] Blocked dangerous key: "${key}"`);
      delete obj[key];
    } else if (obj[key] !== null && typeof obj[key] === 'object') {
      sanitizeObject(obj[key] as Record<string, unknown>);
    }
  }
}

// NoSQL injection prevention — mutates body/params, reads query without reassigning
sanitizeRouter.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body as Record<string, unknown>);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params as unknown as Record<string, unknown>);
  }
  // Sanitize query values in-place (never reassign req.query — it's a getter in Node 22)
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query as unknown as Record<string, unknown>);
  }
  next();
});

// HTTP Parameter Pollution protection
sanitizeRouter.use(
  hpp({
    whitelist: [
      // Product filters that legitimately accept arrays
      'brand',
      'category',
      'availability',
      'promo_labels',
      'services',
      // Sort can have multiple fields
      'sort',
    ],
  }),
);

export default sanitizeRouter;
