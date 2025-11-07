import { Request, Response } from 'express';
import brandService from './brand.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * List brands.
 * GET /api/v1/public/brands
 */
const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { brands, total, page, limit } = await brandService.list(
    req.query as Record<string, string>,
  );
  ApiResponse.paginated(res, brands, total, page, limit, 'Brands retrieved');
});

/**
 * Get brand by ID.
 * GET /api/v1/public/brands/:id
 */
const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const brand = await brandService.getById(req.params.id as string);
  ApiResponse.success(res, brand, 'Brand retrieved');
});

/**
 * Get brand by slug.
 * GET /api/v1/public/brands/slug/:slug
 */
const getBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const brand = await brandService.getBySlug(req.params.slug as string);
  ApiResponse.success(res, brand, 'Brand retrieved');
});

export default { list, getById, getBySlug };
