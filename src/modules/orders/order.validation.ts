import { z } from 'zod/v4';

/**
 * Order item input schema (for creating an order).
 */
const orderItemInput = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

/**
 * Create order schema.
 */
export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemInput).min(1, 'At least one item is required'),
    shipping_address_id: z.string().min(1, 'Shipping address is required'),
    billing_address_id: z.string().min(1, 'Billing address is required'),
    payment_method: z.enum(['card', 'twint', 'postfinance', 'invoice']),
    coupon_code: z.string().optional(),
    notes: z.string().max(500).optional(),
    is_store_pickup: z.boolean().optional().default(false),
    store_pickup_id: z.string().optional(),
  }).refine(
    (data) => !data.is_store_pickup || data.store_pickup_id,
    { message: 'Store pickup ID is required for store pickup orders' },
  ),
});

/**
 * List orders query schema.
 */
export const listOrdersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.string().optional(),
    payment_status: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'total_asc', 'total_desc']).optional(),
  }),
});

/**
 * Order param schema.
 */
export const orderParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

/**
 * Cancel order schema.
 */
export const cancelOrderSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(1, 'Cancellation reason is required').max(500),
  }),
});

/**
 * Return order schema.
 */
export const returnOrderSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(1, 'Return reason is required').max(500),
  }),
});
