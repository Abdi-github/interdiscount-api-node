import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const listAdminProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    min_price: z.string().optional(),
    max_price: z.string().optional(),
    availability: z.string().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
    is_active: z.enum(['true', 'false']).optional(),
    q: z.string().optional(),
    sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'name', 'oldest']).optional(),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid product ID'),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(500).trim(),
    name_short: z.string().max(200).trim().optional(),
    slug: z.string().min(1).max(500).trim(),
    code: z.string().min(1).max(100).trim(),
    displayed_code: z.string().max(100).trim().optional(),
    brand_id: z.string().regex(objectIdRegex).nullable().optional(),
    category_id: z.string().regex(objectIdRegex),
    price: z.number().min(0),
    original_price: z.number().min(0).nullable().optional(),
    currency: z.string().default('CHF'),
    specification: z.string().optional(),
    availability_state: z.enum(['INSTOCK', 'OUTOFSTOCK', 'LOWSTOCK', 'PREORDER', 'DISCONTINUED']).optional(),
    delivery_days: z.number().int().min(0).optional(),
    in_store_possible: z.boolean().optional(),
    release_date: z.string().nullable().optional(),
    services: z.array(z.object({
      code: z.string(),
      name: z.string(),
      price: z.number().min(0),
    })).optional(),
    promo_labels: z.array(z.string()).optional(),
    is_speed_product: z.boolean().optional(),
    is_orderable: z.boolean().optional(),
    is_sustainable: z.boolean().optional(),
    is_active: z.boolean().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(500).trim().optional(),
    name_short: z.string().max(200).trim().optional(),
    slug: z.string().min(1).max(500).trim().optional(),
    displayed_code: z.string().max(100).trim().optional(),
    brand_id: z.string().regex(objectIdRegex).nullable().optional(),
    category_id: z.string().regex(objectIdRegex).optional(),
    price: z.number().min(0).optional(),
    original_price: z.number().min(0).nullable().optional(),
    specification: z.string().optional(),
    availability_state: z.enum(['INSTOCK', 'OUTOFSTOCK', 'LOWSTOCK', 'PREORDER', 'DISCONTINUED']).optional(),
    delivery_days: z.number().int().min(0).optional(),
    in_store_possible: z.boolean().optional(),
    release_date: z.string().nullable().optional(),
    services: z.array(z.object({
      code: z.string(),
      name: z.string(),
      price: z.number().min(0),
    })).optional(),
    promo_labels: z.array(z.string()).optional(),
    is_speed_product: z.boolean().optional(),
    is_orderable: z.boolean().optional(),
    is_sustainable: z.boolean().optional(),
    is_active: z.boolean().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
  }),
});

export const updateProductStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid product ID'),
  }),
  body: z.object({
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
  }),
});

export const deleteProductImageSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid product ID'),
    imageId: z.string().min(1, 'Image ID is required'),
  }),
});
