import { z } from 'zod/v4';

export const listCantonsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
    sort: z.enum(['name', 'code']).optional(),
  }),
});
