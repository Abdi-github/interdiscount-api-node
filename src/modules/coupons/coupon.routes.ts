import { Router } from 'express';
import couponController from './coupon.controller';
import auth from '../../shared/middlewares/auth';
import validate from '../../shared/middlewares/validate';
import { validateCouponSchema } from './coupon.validation';

const router = Router();

// All coupon routes require authentication
router.use(auth);

router.post('/validate', validate(validateCouponSchema), couponController.validateCoupon);
router.get('/available', couponController.listAvailable);

export default router;
