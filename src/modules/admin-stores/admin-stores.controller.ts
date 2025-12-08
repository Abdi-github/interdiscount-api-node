import { Request, Response } from 'express';
import adminStoresService from './admin-stores.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminStoresController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const { stores, total, page, limit } = await adminStoresService.list(query);
    ApiResponse.paginated(res, stores, total, page, limit, 'Stores fetched');
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const store = await adminStoresService.create(req.body);
    ApiResponse.created(res, store, 'Store created');
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const store = await adminStoresService.getById(id);
    ApiResponse.success(res, store, 'Store fetched');
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const store = await adminStoresService.update(id, req.body);
    ApiResponse.success(res, store, 'Store updated');
  });

  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const store = await adminStoresService.updateStatus(id, req.body.is_active);
    ApiResponse.success(res, store, `Store ${req.body.is_active ? 'activated' : 'deactivated'}`);
  });

  getInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const query = req.query as { page?: string; limit?: string };
    const { inventory, total, page, limit } = await adminStoresService.getInventory(id, query);
    ApiResponse.paginated(res, inventory, total, page, limit, 'Store inventory fetched');
  });

  getStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const staff = await adminStoresService.getStaff(id);
    ApiResponse.success(res, staff, 'Store staff fetched');
  });

  updateStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const staff = await adminStoresService.updateStaff(id, req.body.user_ids);
    ApiResponse.success(res, staff, 'Store staff updated');
  });

  getAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const analytics = await adminStoresService.getAnalytics(id);
    ApiResponse.success(res, analytics, 'Store analytics fetched');
  });
}

export default new AdminStoresController();
