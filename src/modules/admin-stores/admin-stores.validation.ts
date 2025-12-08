import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const listAdminStoresSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(),
    canton_id: z.string().optional(),
    city_id: z.string().optional(),
    format: z.enum(['standard', 'xxl', 'compact']).optional(),
    is_active: z.enum(['true', 'false']).optional(),
    sort: z.enum(['name', 'newest', 'format']).optional(),
  }),
});

export const storeIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid store ID'),
  }),
});

const openingHourInput = z.object({
  day: z.object({
    en: z.string().min(1),
    fr: z.string().min(1),
    de: z.string().min(1),
    it: z.string().min(1),
  }),
  open: z.string().default(''),
  close: z.string().default(''),
  is_closed: z.boolean().default(false),
});

export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(300).trim(),
    slug: z.string().min(1).max(300).trim(),
    store_id: z.string().min(1).max(100).trim(),
    street: z.string().max(200).trim().optional(),
    street_number: z.string().max(20).trim().optional(),
    postal_code: z.string().max(10).trim().optional(),
    city_id: z.string().regex(objectIdRegex),
    canton_id: z.string().regex(objectIdRegex),
    remarks: z.string().max(500).trim().optional(),
    phone: z.string().max(30).trim().optional(),
    email: z.string().email().optional(),
    latitude: z.number(),
    longitude: z.number(),
    format: z.enum(['standard', 'xxl', 'compact']).optional(),
    is_xxl: z.boolean().optional(),
    opening_hours: z.array(openingHourInput).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateStoreSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid store ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(300).trim().optional(),
    slug: z.string().min(1).max(300).trim().optional(),
    street: z.string().max(200).trim().optional(),
    street_number: z.string().max(20).trim().optional(),
    postal_code: z.string().max(10).trim().optional(),
    city_id: z.string().regex(objectIdRegex).optional(),
    canton_id: z.string().regex(objectIdRegex).optional(),
    remarks: z.string().max(500).trim().optional(),
    phone: z.string().max(30).trim().optional(),
    email: z.string().email().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    format: z.enum(['standard', 'xxl', 'compact']).optional(),
    is_xxl: z.boolean().optional(),
    opening_hours: z.array(openingHourInput).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateStoreStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid store ID'),
  }),
  body: z.object({
    is_active: z.boolean(),
  }),
});

export const storeInventoryQuerySchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid store ID'),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

export const updateStoreStaffSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid store ID'),
  }),
  body: z.object({
    user_ids: z.array(z.string().regex(objectIdRegex)).min(0),
  }),
});
