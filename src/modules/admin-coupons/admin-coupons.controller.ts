import { Request, Response } from 'express';
import adminCouponsService from './admin-coupons.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminCouponsController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const { coupons, total, page, limit } = await adminCouponsService.list(query);
    ApiResponse.paginated(res, coupons, total, page, limit, 'Coupons fetched');
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const coupon = await adminCouponsService.getById(id);
    ApiResponse.success(res, coupon, 'Coupon fetched');
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const coupon = await adminCouponsService.create(req.body);
    ApiResponse.created(res, coupon, 'Coupon created');
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const coupon = await adminCouponsService.update(id, req.body);
    ApiResponse.success(res, coupon, 'Coupon updated');
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await adminCouponsService.delete(id);
    ApiResponse.noContent(res);
  });
}

export default new AdminCouponsController();
