import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * List promotions for a store.
 */
export const listPromotionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
    discount_type: z.enum(['percentage', 'fixed', 'buy_x_get_y']).optional(),
    current: z.enum(['true', 'false']).optional(),
  }).optional(),
});

/**
 * Create a store promotion.
 */
export const createPromotionSchema = z.object({
  body: z.object({
    product_id: z.string().regex(objectIdRegex, 'Invalid product ID').nullable().optional(),
    category_id: z.string().regex(objectIdRegex, 'Invalid category ID').nullable().optional(),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    discount_type: z.enum(['percentage', 'fixed', 'buy_x_get_y']),
    discount_value: z.number().min(0),
    buy_quantity: z.number().int().min(1).nullable().optional(),
    get_quantity: z.number().int().min(1).nullable().optional(),
    valid_from: z.string(),
    valid_until: z.string(),
    is_active: z.boolean().optional(),
  }).refine(
    (data) => {
      if (data.discount_type === 'buy_x_get_y') {
        return data.buy_quantity != null && data.get_quantity != null;
      }
      return true;
    },
    { message: 'buy_quantity and get_quantity are required for buy_x_get_y promotions' },
  ).refine(
    (data) => {
      if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return false;
      }
      return true;
    },
    { message: 'Percentage discount cannot exceed 100' },
  ),
});

/**
 * Promotion ID param.
 */
export const promotionParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid promotion ID'),
  }),
});

/**
 * Update a promotion.
 */
export const updatePromotionSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid promotion ID'),
  }),
  body: z.object({
    product_id: z.string().regex(objectIdRegex, 'Invalid product ID').nullable().optional(),
    category_id: z.string().regex(objectIdRegex, 'Invalid category ID').nullable().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    discount_type: z.enum(['percentage', 'fixed', 'buy_x_get_y']).optional(),
    discount_value: z.number().min(0).optional(),
    buy_quantity: z.number().int().min(1).nullable().optional(),
    get_quantity: z.number().int().min(1).nullable().optional(),
    valid_from: z.string().optional(),
    valid_until: z.string().optional(),
    is_active: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
