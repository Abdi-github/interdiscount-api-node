import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * List inventory for a store — with pagination, filters, and sorting.
 */
export const listInventorySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.enum(['quantity_asc', 'quantity_desc', 'product_name', 'location', 'updated']).optional(),
    low_stock: z.enum(['true', 'false']).optional(),
    out_of_stock: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
  }).optional(),
});

/**
 * Get or update inventory for a specific product.
 */
export const inventoryProductParamSchema = z.object({
  params: z.object({
    productId: z.string().regex(objectIdRegex, 'Invalid product ID'),
  }),
});

/**
 * Update stock for a product.
 */
export const updateInventorySchema = z.object({
  params: z.object({
    productId: z.string().regex(objectIdRegex, 'Invalid product ID'),
  }),
  body: z.object({
    quantity: z.number().int().min(0).optional(),
    reserved: z.number().int().min(0).optional(),
    min_stock: z.number().int().min(0).optional(),
    max_stock: z.number().int().min(0).optional(),
    location_in_store: z.string().max(200).optional(),
    is_display_unit: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

/**
 * Bulk update: array of product stock entries.
 */
export const bulkUpdateInventorySchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        product_id: z.string().regex(objectIdRegex, 'Invalid product ID'),
        quantity: z.number().int().min(0),
        location_in_store: z.string().max(200).optional(),
      }),
    ).min(1).max(100),
  }),
});

/**
 * Scan update — update stock by product code (barcode scan).
 */
export const scanUpdateSchema = z.object({
  body: z.object({
    product_code: z.string().min(1, 'Product code is required'),
    quantity_change: z.number().int(),
    operation: z.enum(['add', 'subtract', 'set']),
  }),
});
