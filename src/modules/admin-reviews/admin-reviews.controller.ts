import { Request, Response } from 'express';
import adminReviewsService from './admin-reviews.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminReviewsController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const { reviews, total, page, limit } = await adminReviewsService.list(query);
    ApiResponse.paginated(res, reviews, total, page, limit, 'Reviews fetched');
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const review = await adminReviewsService.getById(id);
    ApiResponse.success(res, review, 'Review fetched');
  });

  approve = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const review = await adminReviewsService.approve(id, req.body.is_approved);
    ApiResponse.success(res, review, `Review ${req.body.is_approved ? 'approved' : 'rejected'}`);
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await adminReviewsService.delete(id);
    ApiResponse.noContent(res);
  });
}

export default new AdminReviewsController();
