import { Router } from 'express';
import controller from './admin-orders.controller';
import validate from '../../shared/middlewares/validate';
import {
  listAdminOrdersSchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
  exportOrdersSchema,
} from './admin-orders.validation';

const router = Router();

router.get('/', validate(listAdminOrdersSchema), controller.list);
router.get('/export', validate(exportOrdersSchema), controller.export);
router.get('/:id', validate(orderIdParamSchema), controller.getById);
router.put('/:id/status', validate(updateOrderStatusSchema), controller.updateStatus);

export default router;
