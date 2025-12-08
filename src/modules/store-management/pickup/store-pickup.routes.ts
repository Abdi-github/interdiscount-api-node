import { Router } from 'express';
import storePickupController from './store-pickup.controller';
import validate from '../../../shared/middlewares/validate';
import asyncHandler from '../../../shared/utils/asyncHandler';
import {
  listPickupOrdersSchema,
  pickupOrderParamSchema,
  cancelPickupOrderSchema,
} from './store-pickup.validation';

const router = Router();

// GET /store/pickup-orders — List pickup orders
router.get(
  '/',
  validate(listPickupOrdersSchema),
  asyncHandler(storePickupController.list),
);

// GET /store/pickup-orders/:id — Get detail
router.get(
  '/:id',
  validate(pickupOrderParamSchema),
  asyncHandler(storePickupController.getById),
);

// PUT /store/pickup-orders/:id/confirm — Confirm & prepare
router.put(
  '/:id/confirm',
  validate(pickupOrderParamSchema),
  asyncHandler(storePickupController.confirm),
);

// PUT /store/pickup-orders/:id/ready — Mark ready
router.put(
  '/:id/ready',
  validate(pickupOrderParamSchema),
  asyncHandler(storePickupController.markReady),
);

// PUT /store/pickup-orders/:id/collected — Mark collected
router.put(
  '/:id/collected',
  validate(pickupOrderParamSchema),
  asyncHandler(storePickupController.markCollected),
);

// PUT /store/pickup-orders/:id/cancel — Cancel
router.put(
  '/:id/cancel',
  validate(cancelPickupOrderSchema),
  asyncHandler(storePickupController.cancel),
);

export default router;
