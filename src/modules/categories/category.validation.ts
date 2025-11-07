import { z } from 'zod/v4';

export const listCategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    level: z.string().optional(),
    parent_id: z.string().optional(),
    format: z.enum(['flat', 'tree']).optional(),
    is_active: z.enum(['true', 'false']).optional(),
    sort: z.enum(['name', 'sort_order', 'level']).optional(),
  }),
});
