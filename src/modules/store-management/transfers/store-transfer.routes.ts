import { Router } from 'express';
import storeTransferController from './store-transfer.controller';
import validate from '../../../shared/middlewares/validate';
import asyncHandler from '../../../shared/utils/asyncHandler';
import {
  listTransfersSchema,
  createTransferSchema,
  transferParamSchema,
  receiveTransferSchema,
  cancelTransferSchema,
} from './store-transfer.validation';

const router = Router();

// GET /store/transfers — List transfers
router.get(
  '/',
  validate(listTransfersSchema),
  asyncHandler(storeTransferController.list),
);

// POST /store/transfers — Request transfer
router.post(
  '/',
  validate(createTransferSchema),
  asyncHandler(storeTransferController.create),
);

// GET /store/transfers/:id — Get detail
router.get(
  '/:id',
  validate(transferParamSchema),
  asyncHandler(storeTransferController.getById),
);

// PUT /store/transfers/:id/ship — Ship transfer
router.put(
  '/:id/ship',
  validate(transferParamSchema),
  asyncHandler(storeTransferController.ship),
);

// PUT /store/transfers/:id/receive — Receive transfer
router.put(
  '/:id/receive',
  validate(receiveTransferSchema),
  asyncHandler(storeTransferController.receive),
);

// PUT /store/transfers/:id/cancel — Cancel transfer
router.put(
  '/:id/cancel',
  validate(cancelTransferSchema),
  asyncHandler(storeTransferController.cancel),
);

export default router;
