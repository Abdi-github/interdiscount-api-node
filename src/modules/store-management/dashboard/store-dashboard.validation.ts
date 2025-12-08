import { z } from 'zod/v4';

/**
 * Revenue analytics query params.
 */
export const revenueQuerySchema = z.object({
  query: z.object({
    period: z.enum(['daily', 'weekly', 'monthly']).optional(),
    days: z.string().optional(),
  }).optional(),
});

/**
 * Top products query params.
 */
export const topProductsQuerySchema = z.object({
  query: z.object({
    limit: z.string().optional(),
    days: z.string().optional(),
  }).optional(),
});
