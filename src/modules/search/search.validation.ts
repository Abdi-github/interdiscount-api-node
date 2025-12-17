import { z } from 'zod/v4';

export const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1),
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    min_price: z.string().optional(),
    max_price: z.string().optional(),
    availability: z.string().optional(),
    sort: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'newest']).optional(),
  }),
});

export const suggestionsSchema = z.object({
  query: z.object({
    q: z.string().min(1),
    limit: z.string().optional(),
  }),
});

export const filtersSchema = z.object({
  query: z.object({
    q: z.string().min(1),
    category: z.string().optional(),
  }),
});
