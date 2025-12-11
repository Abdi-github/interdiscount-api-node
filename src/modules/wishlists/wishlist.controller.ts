import { Request, Response } from 'express';
import wishlistService from './wishlist.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * GET /api/v1/customer/wishlist
 */
const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { items, total, page, limit } = await wishlistService.list(
    req.user!._id,
    req.query as { page?: string; limit?: string },
  );
  ApiResponse.paginated(res, items, total, page, limit, 'Wishlist retrieved');
});

/**
 * POST /api/v1/customer/wishlist/:productId
 */
const add = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const entry = await wishlistService.add(req.user!._id, req.params.productId as string);
  ApiResponse.created(res, entry, 'Product added to wishlist');
});

/**
 * DELETE /api/v1/customer/wishlist/:productId
 */
const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await wishlistService.remove(req.user!._id, req.params.productId as string);
  ApiResponse.success(res, null, 'Product removed from wishlist');
});

/**
 * GET /api/v1/customer/wishlist/check/:productId
 */
const check = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await wishlistService.check(req.user!._id, req.params.productId as string);
  ApiResponse.success(res, result, 'Wishlist check complete');
});

export default { list, add, remove, check };
