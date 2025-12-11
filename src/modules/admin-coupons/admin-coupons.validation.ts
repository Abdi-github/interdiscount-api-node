import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const translationInput = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
  de: z.string().min(1),
  it: z.string().min(1),
});

export const listAdminCouponsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
    discount_type: z.enum(['percentage', 'fixed']).optional(),
    q: z.string().optional(),
    sort: z.enum(['newest', 'code', 'usage', 'expiry']).optional(),
  }),
});

export const couponIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid coupon ID'),
  }),
});

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50).trim().transform((v) => v.toUpperCase()),
    description: translationInput,
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.number().min(0),
    minimum_order: z.number().min(0).optional(),
    max_uses: z.number().int().min(1).optional(),
    valid_from: z.string(),
    valid_until: z.string(),
    is_active: z.boolean().optional(),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid coupon ID'),
  }),
  body: z.object({
    code: z.string().min(1).max(50).trim().transform((v) => v.toUpperCase()).optional(),
    description: translationInput.optional(),
    discount_type: z.enum(['percentage', 'fixed']).optional(),
    discount_value: z.number().min(0).optional(),
    minimum_order: z.number().min(0).optional(),
    max_uses: z.number().int().min(1).optional(),
    valid_from: z.string().optional(),
    valid_until: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});
