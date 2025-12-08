import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * List pickup orders for a store.
 */
export const listPickupOrdersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum([
      'PLACED', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED', 'PICKUP_EXPIRED',
    ]).optional(),
    sort: z.enum(['newest', 'oldest', 'status']).optional(),
  }).optional(),
});

/**
 * Pickup order ID param.
 */
export const pickupOrderParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid order ID'),
  }),
});

/**
 * Cancel with reason.
 */
export const cancelPickupOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid order ID'),
  }),
  body: z.object({
    reason: z.string().min(1).max(500),
  }),
});
