import { Router } from 'express';
import storePromotionController from './store-promotion.controller';
import validate from '../../../shared/middlewares/validate';
import asyncHandler from '../../../shared/utils/asyncHandler';
import {
  listPromotionsSchema,
  createPromotionSchema,
  promotionParamSchema,
  updatePromotionSchema,
} from './store-promotion.validation';

const router = Router();

// GET /store/promotions — List promotions
router.get(
  '/',
  validate(listPromotionsSchema),
  asyncHandler(storePromotionController.list),
);

// POST /store/promotions — Create promotion
router.post(
  '/',
  validate(createPromotionSchema),
  asyncHandler(storePromotionController.create),
);

// GET /store/promotions/:id — Get detail
router.get(
  '/:id',
  validate(promotionParamSchema),
  asyncHandler(storePromotionController.getById),
);

// PUT /store/promotions/:id — Update promotion
router.put(
  '/:id',
  validate(updatePromotionSchema),
  asyncHandler(storePromotionController.update),
);

// DELETE /store/promotions/:id — Delete promotion
router.delete(
  '/:id',
  validate(promotionParamSchema),
  asyncHandler(storePromotionController.delete),
);

export default router;
