import { Request, Response } from 'express';
import storeDashboardService from './store-dashboard.service';
import ApiResponse from '../../../shared/utils/ApiResponse';
import ApiError from '../../../shared/errors/ApiError';

/**
 * Store Dashboard Controller — analytics endpoints for store managers.
 */
class StoreDashboardController {
  /**
   * GET /store/dashboard — Store overview stats.
   */
  async getStats(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const stats = await storeDashboardService.getStats(storeId);
    ApiResponse.success(res, stats, 'Store dashboard stats retrieved');
  }

  /**
   * GET /store/dashboard/revenue — Revenue analytics.
   */
  async getRevenue(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const query = req.query as Record<string, string>;
    const period = query.period || 'daily';
    const days = parseInt(query.days || '30', 10);

    const revenue = await storeDashboardService.getRevenue(storeId, period, days);
    ApiResponse.success(res, revenue, 'Revenue data retrieved');
  }

  /**
   * GET /store/dashboard/top-products — Top selling products.
   */
  async getTopProducts(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const query = req.query as Record<string, string>;
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '10', 10)));
    const days = parseInt(query.days || '30', 10);

    const products = await storeDashboardService.getTopProducts(storeId, limit, days);
    ApiResponse.success(res, products, 'Top products retrieved');
  }

  /**
   * GET /store/dashboard/pickup-summary — Click & collect summary.
   */
  async getPickupSummary(req: Request, res: Response): Promise<void> {
    const storeId = req.user!.store_id;
    if (!storeId) throw ApiError.forbidden('No store assigned');

    const summary = await storeDashboardService.getPickupSummary(storeId);
    ApiResponse.success(res, summary, 'Pickup summary retrieved');
  }
}

export default new StoreDashboardController();
