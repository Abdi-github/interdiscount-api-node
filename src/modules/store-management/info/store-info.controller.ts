import { Request, Response } from 'express';
import storeInfoService from './store-info.service';
import ApiResponse from '../../../shared/utils/ApiResponse';
import ApiError from '../../../shared/errors/ApiError';

/**
 * Store Info Controller — store details and staff management.
 */
class StoreInfoController {
  /**
   * GET /store/info — Get my store's info.
   */
  async getInfo(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const store = await storeInfoService.getStoreInfo(storeId);
    ApiResponse.success(res, store, 'Store info retrieved');
  }

  /**
   * PUT /store/info — Update store info.
   */
  async updateInfo(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const store = await storeInfoService.updateStoreInfo(storeId, req.body);
    ApiResponse.success(res, store, 'Store info updated');
  }

  /**
   * GET /store/staff — List staff assigned to my store.
   */
  async getStaff(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const staff = await storeInfoService.getStaff(storeId);
    ApiResponse.success(res, staff, 'Store staff retrieved');
  }
}

export default new StoreInfoController();
