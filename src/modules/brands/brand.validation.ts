import { z } from 'zod/v4';

export const listBrandsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(), // Search by name
    is_active: z.enum(['true', 'false']).optional(),
    sort: z.enum(['name', 'product_count']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});
