import { Request, Response } from 'express';
import storePromotionService from './store-promotion.service';
import ApiResponse from '../../../shared/utils/ApiResponse';
import ApiError from '../../../shared/errors/ApiError';

/**
 * Store Promotion Controller — manage store-specific promotions.
 */
class StorePromotionController {
  /**
   * GET /store/promotions — List promotions for this store.
   */
  async list(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const result = await storePromotionService.list(storeId, req.query as Record<string, string>);

    ApiResponse.paginated(
      res,
      result.promotions,
      result.total,
      result.page,
      result.limit,
      'Store promotions retrieved',
    );
  }

  /**
   * POST /store/promotions — Create a promotion.
   */
  async create(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const promotion = await storePromotionService.create(storeId, req.user!._id, req.body);

    ApiResponse.created(res, promotion, 'Store promotion created');
  }

  /**
   * GET /store/promotions/:id — Get promotion detail.
   */
  async getById(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const promotionId = req.params.id as string;
    const promotion = await storePromotionService.getById(storeId, promotionId);

    ApiResponse.success(res, promotion, 'Promotion detail retrieved');
  }

  /**
   * PUT /store/promotions/:id — Update promotion.
   */
  async update(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const promotionId = req.params.id as string;
    const promotion = await storePromotionService.update(storeId, promotionId, req.body);

    ApiResponse.success(res, promotion, 'Promotion updated');
  }

  /**
   * DELETE /store/promotions/:id — Delete promotion.
   */
  async delete(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const promotionId = req.params.id as string;
    await storePromotionService.delete(storeId, promotionId);

    ApiResponse.success(res, null, 'Promotion deleted');
  }
}

export default new StorePromotionController();
