import { z } from 'zod/v4';

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').max(50).trim(),
    order_total: z.number().min(0, 'Order total must be non-negative').optional(),
  }),
});
