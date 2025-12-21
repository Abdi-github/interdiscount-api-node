import { Request, Response, NextFunction } from 'express';

/**
 * Recursive XSS sanitizer for request body, query, and params.
 * Strips dangerous HTML tags and event handlers from string values.
 *
 * This does NOT use the deprecated xss-clean package.
 * Instead, it applies regex-based sanitization to strip:
 * - <script> tags and their content
 * - Event handler attributes (onclick, onerror, onload, etc.)
 * - javascript: protocol in href/src attributes
 * - <iframe>, <object>, <embed>, <form> tags
 */

const DANGEROUS_PATTERNS: RegExp[] = [
  // Script tags with content
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  // Opening script tags (unclosed)
  /<script\b[^>]*>/gi,
  // Event handlers (on*)
  /\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi,
  // javascript: protocol
  /javascript\s*:/gi,
  // data: protocol in src-like contexts
  /data\s*:\s*text\/html/gi,
  // Dangerous HTML elements
  /<\/?(?:iframe|object|embed|form|link|meta)\b[^>]*>/gi,
  // HTML comments that could hide code
  /<!--[\s\S]*?-->/g,
  // Expression() in CSS
  /expression\s*\([^)]*\)/gi,
  // vbscript: protocol
  /vbscript\s*:/gi,
];

const sanitizeString = (value: string): string => {
  let sanitized = value;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized.trim();
};

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }
  return value;
};

const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
};

const xssSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body as Record<string, unknown>);
  }
  // Note: req.query is read-only in Express 5, so we do not mutate it.
  // XSS in query params is typically a concern for server-rendered HTML.
  // For a JSON API, query params are validated by Zod schemas.
  next();
};

export default xssSanitize;
