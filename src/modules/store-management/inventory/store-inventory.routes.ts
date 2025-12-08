import { Router } from 'express';
import storeInventoryController from './store-inventory.controller';
import validate from '../../../shared/middlewares/validate';
import asyncHandler from '../../../shared/utils/asyncHandler';
import {
  listInventorySchema,
  inventoryProductParamSchema,
  updateInventorySchema,
  bulkUpdateInventorySchema,
  scanUpdateSchema,
} from './store-inventory.validation';

const router = Router();

// GET /store/inventory/low-stock — must be before :productId
router.get(
  '/low-stock',
  validate(listInventorySchema),
  asyncHandler(storeInventoryController.getLowStock),
);

// GET /store/inventory/out-of-stock
router.get(
  '/out-of-stock',
  validate(listInventorySchema),
  asyncHandler(storeInventoryController.getOutOfStock),
);

// GET /store/inventory/export
router.get(
  '/export',
  asyncHandler(storeInventoryController.exportInventory),
);

// POST /store/inventory/bulk-update
router.post(
  '/bulk-update',
  validate(bulkUpdateInventorySchema),
  asyncHandler(storeInventoryController.bulkUpdate),
);

// POST /store/inventory/scan
router.post(
  '/scan',
  validate(scanUpdateSchema),
  asyncHandler(storeInventoryController.scanUpdate),
);

// GET /store/inventory — list all
router.get(
  '/',
  validate(listInventorySchema),
  asyncHandler(storeInventoryController.list),
);

// GET /store/inventory/:productId
router.get(
  '/:productId',
  validate(inventoryProductParamSchema),
  asyncHandler(storeInventoryController.getByProductId),
);

// PUT /store/inventory/:productId
router.put(
  '/:productId',
  validate(updateInventorySchema),
  asyncHandler(storeInventoryController.update),
);

export default router;
