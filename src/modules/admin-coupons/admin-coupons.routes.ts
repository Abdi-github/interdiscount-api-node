import { Router } from 'express';
import controller from './admin-coupons.controller';
import validate from '../../shared/middlewares/validate';
import {
  listAdminCouponsSchema,
  couponIdParamSchema,
  createCouponSchema,
  updateCouponSchema,
} from './admin-coupons.validation';

const router = Router();

router.get('/', validate(listAdminCouponsSchema), controller.list);
router.post('/', validate(createCouponSchema), controller.create);
router.get('/:id', validate(couponIdParamSchema), controller.getById);
router.put('/:id', validate(updateCouponSchema), controller.update);
router.delete('/:id', validate(couponIdParamSchema), controller.delete);

export default router;
