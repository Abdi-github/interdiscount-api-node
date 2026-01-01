import { z } from 'zod/v4';

export const listCitiesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    canton_id: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
    sort: z.enum(['name', 'slug']).optional(),
  }),
});
