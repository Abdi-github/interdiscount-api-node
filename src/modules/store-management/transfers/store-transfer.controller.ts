import { Request, Response } from 'express';
import storeTransferService from './store-transfer.service';
import ApiResponse from '../../../shared/utils/ApiResponse';
import ApiError from '../../../shared/errors/ApiError';

/**
 * Store Transfer Controller — stock transfer management for store managers.
 */
class StoreTransferController {
  /**
   * GET /store/transfers — List transfers (sent + received).
   */
  async list(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const result = await storeTransferService.list(storeId, req.query as Record<string, string>);

    ApiResponse.paginated(
      res,
      result.transfers,
      result.total,
      result.page,
      result.limit,
      'Stock transfers retrieved',
    );
  }

  /**
   * POST /store/transfers — Request a stock transfer.
   */
  async create(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const transfer = await storeTransferService.create(
      storeId,
      req.user!._id,
      req.body,
    );

    ApiResponse.created(res, transfer, 'Stock transfer requested');
  }

  /**
   * GET /store/transfers/:id — Get transfer detail.
   */
  async getById(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const transferId = req.params.id as string;
    const transfer = await storeTransferService.getById(storeId, transferId);

    ApiResponse.success(res, transfer, 'Transfer detail retrieved');
  }

  /**
   * PUT /store/transfers/:id/ship — Mark as shipped (source store).
   */
  async ship(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const transferId = req.params.id as string;
    const transfer = await storeTransferService.ship(storeId, transferId);

    ApiResponse.success(res, transfer, 'Transfer marked as shipped');
  }

  /**
   * PUT /store/transfers/:id/receive — Mark as received (destination store).
   */
  async receive(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const transferId = req.params.id as string;
    const transfer = await storeTransferService.receive(
      storeId,
      transferId,
      req.body.items,
      req.body.notes,
    );

    ApiResponse.success(res, transfer, 'Transfer received');
  }

  /**
   * PUT /store/transfers/:id/cancel — Cancel transfer.
   */
  async cancel(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const transferId = req.params.id as string;
    const transfer = await storeTransferService.cancel(
      storeId,
      transferId,
      req.body?.reason,
    );

    ApiResponse.success(res, transfer, 'Transfer cancelled');
  }
}

export default new StoreTransferController();
