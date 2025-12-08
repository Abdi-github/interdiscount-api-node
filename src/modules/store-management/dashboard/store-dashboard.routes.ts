import { Router } from 'express';
import storeDashboardController from './store-dashboard.controller';
import validate from '../../../shared/middlewares/validate';
import asyncHandler from '../../../shared/utils/asyncHandler';
import { revenueQuerySchema, topProductsQuerySchema } from './store-dashboard.validation';

const router = Router();

// GET /store/dashboard — Overview stats
router.get('/', asyncHandler(storeDashboardController.getStats));

// GET /store/dashboard/revenue — Revenue analytics
router.get(
  '/revenue',
  validate(revenueQuerySchema),
  asyncHandler(storeDashboardController.getRevenue),
);

// GET /store/dashboard/top-products — Top selling products
router.get(
  '/top-products',
  validate(topProductsQuerySchema),
  asyncHandler(storeDashboardController.getTopProducts),
);

// GET /store/dashboard/pickup-summary — Click & collect summary
router.get(
  '/pickup-summary',
  asyncHandler(storeDashboardController.getPickupSummary),
);

export default router;
