import { Router } from 'express';
import storeInfoController from './store-info.controller';
import validate from '../../../shared/middlewares/validate';
import asyncHandler from '../../../shared/utils/asyncHandler';
import { updateStoreInfoSchema } from './store-info.validation';

const router = Router();

// GET /store/info — Get store info
router.get('/info', asyncHandler(storeInfoController.getInfo));

// PUT /store/info — Update store info
router.put(
  '/info',
  validate(updateStoreInfoSchema),
  asyncHandler(storeInfoController.updateInfo),
);

// GET /store/staff — List staff
router.get('/staff', asyncHandler(storeInfoController.getStaff));

export default router;
