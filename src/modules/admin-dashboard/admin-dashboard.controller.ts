import { Request, Response } from 'express';
import adminDashboardService from './admin-dashboard.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminDashboardController {
  /**
   * GET /admin/dashboard/stats
   */
  getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await adminDashboardService.getStats();
    ApiResponse.success(res, stats, 'Platform stats fetched');
  });

  /**
   * GET /admin/dashboard/revenue
   */
  getRevenue = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as { period?: string; start_date?: string; end_date?: string };
    const revenue = await adminDashboardService.getRevenue(query);
    ApiResponse.success(res, revenue, 'Revenue analytics fetched');
  });

  /**
   * GET /admin/dashboard/recent-orders
   */
  getRecentOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as { limit?: string };
    const orders = await adminDashboardService.getRecentOrders(query);
    ApiResponse.success(res, orders, 'Recent orders fetched');
  });
}

export default new AdminDashboardController();
