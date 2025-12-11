import { Request, Response } from 'express';
import couponService from './coupon.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * POST /api/v1/customer/coupons/validate
 */
const validateCoupon = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await couponService.validate(
    req.body.code,
    req.body.order_total,
    req.language,
  );
  ApiResponse.success(res, result, result.valid ? 'Coupon is valid' : 'Coupon is not valid');
});

/**
 * GET /api/v1/customer/coupons/available
 */
const listAvailable = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const coupons = await couponService.listAvailable(req.language);
  ApiResponse.success(res, coupons, 'Available coupons retrieved');
});

export default { validateCoupon, listAvailable };
