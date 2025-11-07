import { z } from 'zod/v4';

export const listProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.string().optional(),        // category_id or slug
    brand: z.string().optional(),            // brand_id or slug
    min_price: z.string().optional(),
    max_price: z.string().optional(),
    availability: z.string().optional(),     // INSTOCK, OUTOFSTOCK, etc.
    in_store: z.enum(['true', 'false']).optional(),
    speed: z.enum(['true', 'false']).optional(),
    sustainable: z.enum(['true', 'false']).optional(),
    on_sale: z.enum(['true', 'false']).optional(),
    min_rating: z.string().optional(),
    q: z.string().optional(),                // text search
    sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'name', 'discount']).optional(),
  }),
});

export const listProductReviewsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful']).optional(),
  }),
});
