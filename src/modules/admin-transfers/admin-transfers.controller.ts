import { Request, Response } from 'express';
import adminTransfersService from './admin-transfers.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminTransfersController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const { transfers, total, page, limit } = await adminTransfersService.list(query);
    ApiResponse.paginated(res, transfers, total, page, limit, 'Transfers fetched');
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const transfer = await adminTransfersService.getById(id);
    ApiResponse.success(res, transfer, 'Transfer fetched');
  });

  approve = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const transfer = await adminTransfersService.approve(
      id,
      req.body.action,
      req.user!._id,
      req.body.notes,
    );
    ApiResponse.success(res, transfer, `Transfer ${req.body.action}d`);
  });

  getAnalytics = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const analytics = await adminTransfersService.getAnalytics();
    ApiResponse.success(res, analytics, 'Transfer analytics fetched');
  });
}

export default new AdminTransfersController();
