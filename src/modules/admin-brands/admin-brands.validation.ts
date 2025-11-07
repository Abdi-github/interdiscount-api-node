import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const listAdminBrandsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
    sort: z.enum(['name', 'product_count', 'newest']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const brandIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid brand ID'),
  }),
});

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).trim(),
    slug: z.string().min(1).max(200).trim(),
    is_active: z.boolean().optional(),
  }),
});

export const updateBrandSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid brand ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    slug: z.string().min(1).max(200).trim().optional(),
    is_active: z.boolean().optional(),
  }),
});
