import { Request, Response } from 'express';
import addressService from './address.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * GET /api/v1/customer/addresses
 */
const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const addresses = await addressService.list(req.user!._id);
  ApiResponse.success(res, addresses, 'Addresses retrieved');
});

/**
 * POST /api/v1/customer/addresses
 */
const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const address = await addressService.create(req.user!._id, req.body);
  ApiResponse.created(res, address, 'Address created');
});

/**
 * PUT /api/v1/customer/addresses/:id
 */
const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const address = await addressService.update(req.user!._id, req.params.id as string, req.body);
  ApiResponse.success(res, address, 'Address updated');
});

/**
 * DELETE /api/v1/customer/addresses/:id
 */
const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await addressService.delete(req.user!._id, req.params.id as string);
  ApiResponse.success(res, null, 'Address deleted');
});

/**
 * PUT /api/v1/customer/addresses/:id/default
 */
const setDefault = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const address = await addressService.setDefault(req.user!._id, req.params.id as string);
  ApiResponse.success(res, address, 'Default address updated');
});

export default { list, create, update, remove, setDefault };
