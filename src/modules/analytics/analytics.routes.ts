import { Router } from 'express';
import controller from './analytics.controller';
import validate from '../../shared/middlewares/validate';
import {
  dashboardQuerySchema,
  revenueQuerySchema,
  topItemsQuerySchema,
  recentOrdersQuerySchema,
  userGrowthQuerySchema,
} from './analytics.validation';

// ============================================================================
// Admin Analytics Routes — mounted at /api/v1/admin/analytics
// Auth + requireRoles('admin', 'super_admin') applied at app.ts level
// ============================================================================

const adminRouter = Router();

adminRouter.get('/platform/stats', validate(dashboardQuerySchema), controller.getPlatformDashboard);
adminRouter.get('/revenue', validate(revenueQuerySchema), controller.getRevenueTimeSeries);
adminRouter.get('/top-products', validate(topItemsQuerySchema), controller.getTopProducts);
adminRouter.get('/top-stores', validate(topItemsQuerySchema), controller.getTopStores);
adminRouter.get('/top-categories', validate(topItemsQuerySchema), controller.getTopCategories);
adminRouter.get('/user-growth', validate(userGrowthQuerySchema), controller.getUserGrowth);
adminRouter.get('/recent-orders', validate(recentOrdersQuerySchema), controller.getRecentOrders);

// ============================================================================
// Store Manager Analytics Routes — mounted at /api/v1/store/analytics
// Auth + requireRoles + requireStoreAccess applied at app.ts level
// ============================================================================

const storeRouter = Router();

storeRouter.get('/dashboard', validate(dashboardQuerySchema), controller.getStoreDashboard);
storeRouter.get('/revenue', validate(revenueQuerySchema), controller.getStoreRevenue);
storeRouter.get('/top-products', validate(topItemsQuerySchema), controller.getStoreTopProducts);

export { adminRouter as adminAnalyticsRoutes, storeRouter as storeAnalyticsRoutes };
