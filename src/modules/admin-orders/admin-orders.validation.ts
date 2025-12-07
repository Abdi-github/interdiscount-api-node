import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const listAdminOrdersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.string().optional(),
    payment_status: z.string().optional(),
    payment_method: z.string().optional(),
    user_id: z.string().optional(),
    is_store_pickup: z.enum(['true', 'false']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    q: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'total_asc', 'total_desc']).optional(),
  }),
});

export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid order ID'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid order ID'),
  }),
  body: z.object({
    status: z.enum([
      'PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED',
      'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED', 'RETURNED', 'PICKUP_EXPIRED',
    ]),
    notes: z.string().max(500).optional(),
  }),
});

export const exportOrdersSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    payment_status: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    format: z.enum(['csv', 'json']).optional(),
  }),
});
