import { Request, Response } from 'express';
import analyticsService from './analytics.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';
import {
  type IAnalyticsDateQuery,
  type IRevenueTimeSeriesQuery,
  type ITopItemsQuery,
  type IRecentOrdersQuery,
  type IDateRange,
  type AnalyticsPeriod,
  ANALYTICS_CONSTANTS,
} from './analytics.types';

/**
 * Resolve date range from query params.
 * Supports preset shortcuts (last_7_days, this_month, etc.) and custom from/to.
 */
function resolveDateRange(query: IAnalyticsDateQuery): IDateRange {
  const now = new Date();
  let from: Date;
  let to: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (query.from && query.to) {
    from = new Date(query.from);
    to = new Date(query.to);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  const preset = query.preset || 'last_30_days';

  switch (preset) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      from = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      to = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'this_week': {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday-based
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      break;
    }
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_7_days':
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      break;
    case 'last_90_days':
      from = new Date(now);
      from.setDate(from.getDate() - 90);
      from.setHours(0, 0, 0, 0);
      break;
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'last_30_days':
    default:
      from = new Date(now);
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      break;
  }

  return { from, to };
}

class AnalyticsController {
  // ==========================================================================
  // Admin — Platform Analytics
  // ==========================================================================

  /**
   * GET /admin/analytics/platform/stats
   */
  getPlatformDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.query || {}) as unknown as IAnalyticsDateQuery;
    const dateRange = resolveDateRange(query);
    const data = await analyticsService.getPlatformDashboard(dateRange);
    ApiResponse.success(res, data, 'Platform dashboard fetched');
  });

  /**
   * GET /admin/analytics/revenue
   */
  getRevenueTimeSeries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.query || {}) as unknown as IRevenueTimeSeriesQuery;
    const dateRange = resolveDateRange(query);
    const period = (query.period as AnalyticsPeriod) || 'daily';
    const data = await analyticsService.getRevenueTimeSeries(dateRange, period);
    ApiResponse.success(res, data, 'Revenue time series fetched');
  });

  /**
   * GET /admin/analytics/top-products
   */
  getTopProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.query || {}) as unknown as ITopItemsQuery;
    const dateRange = resolveDateRange(query);
    const limit = query.limit
      ? parseInt(query.limit, 10)
      : ANALYTICS_CONSTANTS.DEFAULT_TOP_ITEMS_LIMIT;
    const data = await analyticsService.getTopProducts(dateRange, limit);
    ApiResponse.success(res, data, 'Top products fetched');
  });

  /**
   * GET /admin/analytics/top-stores
   */
  getTopStores = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.query || {}) as unknown as ITopItemsQuery;
    const dateRange = resolveDateRange(query);
    const limit = query.limit
      ? parseInt(query.limit, 10)
      : ANALYTICS_CONSTANTS.DEFAULT_TOP_STORES_LIMIT;
    const data = await analyticsService.getTopStores(dateRange, limit);
    ApiResponse.success(res, data, 'Top stores fetched');
  });

  /**
   * GET /admin/analytics/top-categories
   */
  getTopCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.query || {}) as unknown as ITopItemsQuery;
    const dateRange = resolveDateRange(query);
    const limit = query.limit
      ? parseInt(query.limit, 10)
      : ANALYTICS_CONSTANTS.DEFAULT_TOP_ITEMS_LIMIT;
    const data = await analyticsService.getTopCategories(dateRange, limit);
    ApiResponse.success(res, data, 'Top categories fetched');
  });

  /**
   * GET /admin/analytics/user-growth
   */
  getUserGrowth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.query || {}) as unknown as IRevenueTimeSeriesQuery;
    const dateRange = resolveDateRange(query);
    const period = (query.period as AnalyticsPeriod) || 'daily';
    const data = await analyticsService.getUserGrowth(dateRange, period);
    ApiResponse.success(res, data, 'User growth fetched');
  });

  /**
   * GET /admin/analytics/recent-orders
   */
  getRecentOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.query || {}) as unknown as IRecentOrdersQuery;
    const limit = query.limit
      ? parseInt(query.limit, 10)
      : ANALYTICS_CONSTANTS.DEFAULT_RECENT_ORDERS_LIMIT;
    const data = await analyticsService.getRecentOrders(limit);
    ApiResponse.success(res, data, 'Recent orders fetched');
  });

  // ==========================================================================
  // Store Manager — Store Analytics
  // ==========================================================================

  /**
   * GET /store/analytics/dashboard
   */
  getStoreDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const storeId = (req as unknown as Record<string, unknown>).storeId as string;
    const query = (req.query || {}) as unknown as IAnalyticsDateQuery;
    const dateRange = resolveDateRange(query);
    const data = await analyticsService.getStoreDashboard(storeId, dateRange);
    ApiResponse.success(res, data, 'Store dashboard fetched');
  });

  /**
   * GET /store/analytics/revenue
   */
  getStoreRevenue = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const storeId = (req as unknown as Record<string, unknown>).storeId as string;
    const query = (req.query || {}) as unknown as IRevenueTimeSeriesQuery;
    const dateRange = resolveDateRange(query);
    const period = (query.period as AnalyticsPeriod) || 'daily';
    const data = await analyticsService.getStoreRevenueTimeSeries(storeId, dateRange, period);
    ApiResponse.success(res, data, 'Store revenue fetched');
  });

  /**
   * GET /store/analytics/top-products
   */
  getStoreTopProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const storeId = (req as unknown as Record<string, unknown>).storeId as string;
    const query = (req.query || {}) as unknown as ITopItemsQuery;
    const dateRange = resolveDateRange(query);
    const limit = query.limit
      ? parseInt(query.limit, 10)
      : ANALYTICS_CONSTANTS.DEFAULT_TOP_ITEMS_LIMIT;
    const data = await analyticsService.getStoreTopProducts(storeId, dateRange, limit);
    ApiResponse.success(res, data, 'Store top products fetched');
  });
}

export default new AnalyticsController();
