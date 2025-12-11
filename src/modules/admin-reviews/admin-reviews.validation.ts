import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const listAdminReviewsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    is_approved: z.enum(['true', 'false']).optional(),
    product_id: z.string().optional(),
    user_id: z.string().optional(),
    min_rating: z.string().optional(),
    max_rating: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful']).optional(),
  }),
});

export const reviewIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid review ID'),
  }),
});

export const approveReviewSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid review ID'),
  }),
  body: z.object({
    is_approved: z.boolean(),
  }),
});
