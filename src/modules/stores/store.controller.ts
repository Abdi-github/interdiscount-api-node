import { Request, Response } from 'express';
import storeService from './store.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * List stores.
 * GET /api/v1/public/stores
 */
const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { stores, total, page, limit } = await storeService.list(
    req.query as Record<string, string>,
    req.language,
  );
  ApiResponse.paginated(res, stores, total, page, limit, 'Stores retrieved');
});

/**
 * Get store by ID.
 * GET /api/v1/public/stores/:id
 */
const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const store = await storeService.getById(req.params.id as string);
  ApiResponse.success(res, store, 'Store retrieved');
});

/**
 * Get store by slug.
 * GET /api/v1/public/stores/slug/:slug
 */
const getBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const store = await storeService.getBySlug(req.params.slug as string);
  ApiResponse.success(res, store, 'Store retrieved');
});

export default { list, getById, getBySlug };
