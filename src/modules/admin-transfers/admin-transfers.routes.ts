import { Router } from 'express';
import controller from './admin-transfers.controller';
import validate from '../../shared/middlewares/validate';
import {
  listAdminTransfersSchema,
  transferIdParamSchema,
  approveTransferSchema,
} from './admin-transfers.validation';

const router = Router();

router.get('/', validate(listAdminTransfersSchema), controller.list);
router.get('/analytics', controller.getAnalytics);
router.get('/:id', validate(transferIdParamSchema), controller.getById);
router.put('/:id/approve', validate(approveTransferSchema), controller.approve);

export default router;
