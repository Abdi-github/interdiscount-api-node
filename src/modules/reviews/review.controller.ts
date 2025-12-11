import { Request, Response } from 'express';
import reviewService from './review.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * POST /api/v1/customer/reviews
 */
const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const review = await reviewService.create(req.user!._id, req.body, req.language);
  ApiResponse.created(res, review, 'Review submitted for approval');
});

/**
 * GET /api/v1/customer/reviews
 */
const listMine = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { reviews, total, page, limit } = await reviewService.listMyReviews(
    req.user!._id,
    req.query as { page?: string; limit?: string },
  );
  ApiResponse.paginated(res, reviews, total, page, limit, 'Reviews retrieved');
});

/**
 * PUT /api/v1/customer/reviews/:id
 */
const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const review = await reviewService.update(req.user!._id, req.params.id as string, req.body);
  ApiResponse.success(res, review, 'Review updated');
});

/**
 * DELETE /api/v1/customer/reviews/:id
 */
const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await reviewService.delete(req.user!._id, req.params.id as string);
  ApiResponse.success(res, null, 'Review deleted');
});

/**
 * GET /api/v1/public/products/:id/reviews
 */
const listProductReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { reviews, total, page, limit, stats } = await reviewService.listProductReviews(
    req.params.id as string,
    req.query as { page?: string; limit?: string; sort?: string },
  );

  res.status(200).json({
    success: true,
    message: 'Product reviews retrieved',
    data: reviews,
    stats,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_next: page < Math.ceil(total / limit),
      has_prev: page > 1,
    },
  });
});

export default { create, listMine, update, remove, listProductReviews };
