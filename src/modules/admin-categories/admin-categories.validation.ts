import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const translationInput = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
  de: z.string().min(1),
  it: z.string().min(1),
});

export const listAdminCategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    level: z.string().optional(),
    parent_id: z.string().optional(),
    format: z.enum(['flat', 'tree']).optional(),
    is_active: z.enum(['true', 'false']).optional(),
    sort: z.enum(['name', 'sort_order', 'level']).optional(),
    q: z.string().optional(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid category ID'),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: translationInput,
    slug: z.string().min(1).max(200).trim(),
    category_id: z.string().min(1).max(100).trim(),
    level: z.number().int().min(0).max(5),
    parent_id: z.string().regex(objectIdRegex).nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid category ID'),
  }),
  body: z.object({
    name: translationInput.optional(),
    slug: z.string().min(1).max(200).trim().optional(),
    category_id: z.string().min(1).max(100).trim().optional(),
    level: z.number().int().min(0).max(5).optional(),
    parent_id: z.string().regex(objectIdRegex).nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const reorderCategoriesSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        id: z.string().regex(objectIdRegex),
        sort_order: z.number().int().min(0),
      }),
    ).min(1).max(200),
  }),
});
