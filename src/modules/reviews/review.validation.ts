import { z } from 'zod/v4';

export const createReviewSchema = z.object({
  body: z.object({
    product_id: z.string().min(1, 'Product ID is required'),
    rating: z.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
    title: z.string().min(1, 'Title is required').max(200).trim(),
    comment: z.string().min(1, 'Comment is required').max(2000).trim(),
    language: z.enum(['de', 'en', 'fr', 'it']).optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().min(1).max(200).trim().optional(),
    comment: z.string().min(1).max(2000).trim().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const reviewParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listMyReviewsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const listProductReviewsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful']).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});
