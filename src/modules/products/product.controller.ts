import { Request, Response } from 'express';
import productService from './product.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * List products with filters.
 * GET /api/v1/public/products
 */
const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { products, total, page, limit } = await productService.list(
    req.query as Record<string, string>,
  );
  ApiResponse.paginated(res, products, total, page, limit, 'Products retrieved');
});

/**
 * Get product by ID.
 * GET /api/v1/public/products/:id
 */
const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await productService.getById(req.params.id as string);
  ApiResponse.success(res, product, 'Product retrieved');
});

/**
 * Get product by slug.
 * GET /api/v1/public/products/slug/:slug
 */
const getBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await productService.getBySlug(req.params.slug as string);
  ApiResponse.success(res, product, 'Product retrieved');
});

/**
 * Get related products.
 * GET /api/v1/public/products/:id/related
 */
const getRelated = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string || '12', 10);
  const related = await productService.getRelated(req.params.id as string, limit);
  ApiResponse.success(res, related, 'Related products retrieved');
});

export default { list, getById, getBySlug, getRelated };
