import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * List transfers for a store.
 */
export const listTransfersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']).optional(),
    direction: z.enum(['incoming', 'outgoing', 'all']).optional(),
    sort: z.enum(['newest', 'oldest', 'status']).optional(),
  }).optional(),
});

/**
 * Create a transfer request.
 */
export const createTransferSchema = z.object({
  body: z.object({
    from_store_id: z.string().regex(objectIdRegex, 'Invalid source store ID'),
    items: z.array(
      z.object({
        product_id: z.string().regex(objectIdRegex, 'Invalid product ID'),
        quantity: z.number().int().min(1).max(999),
      }),
    ).min(1).max(50),
    notes: z.string().max(500).optional(),
  }),
});

/**
 * Transfer ID param.
 */
export const transferParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid transfer ID'),
  }),
});

/**
 * Receive transfer — with actual received quantities.
 */
export const receiveTransferSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid transfer ID'),
  }),
  body: z.object({
    items: z.array(
      z.object({
        product_id: z.string().regex(objectIdRegex, 'Invalid product ID'),
        received_quantity: z.number().int().min(0),
      }),
    ).min(1),
    notes: z.string().max(500).optional(),
  }),
});

/**
 * Cancel transfer — with optional reason.
 */
export const cancelTransferSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid transfer ID'),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }).optional(),
});
