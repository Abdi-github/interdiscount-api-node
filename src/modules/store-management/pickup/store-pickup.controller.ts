import { Request, Response } from 'express';
import storePickupService from './store-pickup.service';
import ApiResponse from '../../../shared/utils/ApiResponse';
import ApiError from '../../../shared/errors/ApiError';

/**
 * Store Pickup Controller — click & collect order queue management.
 */
class StorePickupController {
  /**
   * GET /store/pickup-orders — List pickup orders for this store.
   */
  async list(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const result = await storePickupService.list(storeId, req.query as Record<string, string>);

    ApiResponse.paginated(
      res,
      result.orders,
      result.total,
      result.page,
      result.limit,
      'Pickup orders retrieved',
    );
  }

  /**
   * GET /store/pickup-orders/:id — Get pickup order detail.
   */
  async getById(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const orderId = req.params.id as string;
    const result = await storePickupService.getById(storeId, orderId);

    ApiResponse.success(res, result, 'Pickup order detail retrieved');
  }

  /**
   * PUT /store/pickup-orders/:id/confirm — Confirm and start preparing.
   */
  async confirm(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const orderId = req.params.id as string;
    const order = await storePickupService.confirmOrder(storeId, orderId);

    ApiResponse.success(res, order, 'Pickup order confirmed — preparing');
  }

  /**
   * PUT /store/pickup-orders/:id/ready — Mark as ready for pickup.
   */
  async markReady(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const orderId = req.params.id as string;
    const order = await storePickupService.markReady(storeId, orderId);

    ApiResponse.success(res, order, 'Pickup order ready for collection');
  }

  /**
   * PUT /store/pickup-orders/:id/collected — Mark as collected.
   */
  async markCollected(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const orderId = req.params.id as string;
    const order = await storePickupService.markCollected(storeId, orderId);

    ApiResponse.success(res, order, 'Pickup order collected successfully');
  }

  /**
   * PUT /store/pickup-orders/:id/cancel — Cancel pickup order.
   */
  async cancel(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const orderId = req.params.id as string;
    const { reason } = req.body;
    const order = await storePickupService.cancelOrder(storeId, orderId, reason);

    ApiResponse.success(res, order, 'Pickup order cancelled');
  }
}

export default new StorePickupController();
