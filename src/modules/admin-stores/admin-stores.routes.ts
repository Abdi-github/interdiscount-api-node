import { Router } from 'express';
import controller from './admin-stores.controller';
import validate from '../../shared/middlewares/validate';
import {
  listAdminStoresSchema,
  storeIdParamSchema,
  createStoreSchema,
  updateStoreSchema,
  updateStoreStatusSchema,
  storeInventoryQuerySchema,
  updateStoreStaffSchema,
} from './admin-stores.validation';

const router = Router();

router.get('/', validate(listAdminStoresSchema), controller.list);
router.post('/', validate(createStoreSchema), controller.create);
router.get('/:id', validate(storeIdParamSchema), controller.getById);
router.put('/:id', validate(updateStoreSchema), controller.update);
router.put('/:id/status', validate(updateStoreStatusSchema), controller.updateStatus);
router.get('/:id/inventory', validate(storeInventoryQuerySchema), controller.getInventory);
router.get('/:id/staff', validate(storeIdParamSchema), controller.getStaff);
router.put('/:id/staff', validate(updateStoreStaffSchema), controller.updateStaff);
router.get('/:id/analytics', validate(storeIdParamSchema), controller.getAnalytics);

export default router;
