import { Router } from 'express';
import paymentController from './payment.controller';
import auth from '../../shared/middlewares/auth';
import validate from '../../shared/middlewares/validate';
import { paymentLimiter } from '../../shared/middlewares/rateLimiters';
import {
  initiatePaymentSchema,
  confirmInvoiceSchema,
} from './payment.validation';

const router = Router();

// All customer payment routes require auth + payment rate limiter
router.use(auth);
router.use(paymentLimiter);

// POST /customer/payments/:orderId/initiate — Start payment
router.post('/:orderId/initiate', validate(initiatePaymentSchema), paymentController.initiate);

// POST /customer/payments/:orderId/simulate — Simulate payment (dev)
router.post('/:orderId/simulate', validate(initiatePaymentSchema), paymentController.simulate);

// POST /customer/payments/:orderId/invoice — Confirm invoice payment
router.post('/:orderId/invoice', validate(confirmInvoiceSchema), paymentController.confirmInvoice);

// GET /customer/payments/:orderId — Get payment status
router.get('/:orderId', validate(initiatePaymentSchema), paymentController.getStatus);

export default router;
