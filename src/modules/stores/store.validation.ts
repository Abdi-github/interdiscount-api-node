import { z } from 'zod/v4';

export const listStoresSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    canton_id: z.string().optional(),
    city_id: z.string().optional(),
    postal_code: z.string().optional(),
    format: z.string().optional(),
    is_xxl: z.enum(['true', 'false']).optional(),
    lat: z.string().optional(),
    lng: z.string().optional(),
    radius: z.string().optional(), // in km
    sort: z.enum(['name', 'distance']).optional(),
  }),
});
