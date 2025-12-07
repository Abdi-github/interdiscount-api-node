import { Router } from 'express';
import orderController from './order.controller';
import auth from '../../shared/middlewares/auth';
import validate from '../../shared/middlewares/validate';
import {
  createOrderSchema,
  listOrdersSchema,
  orderParamSchema,
  cancelOrderSchema,
  returnOrderSchema,
} from './order.validation';

const router = Router();

// All routes require authentication
router.use(auth);

// POST /customer/orders — Place a new order
router.post('/', validate(createOrderSchema), orderController.create);

// GET /customer/orders — List my orders
router.get('/', validate(listOrdersSchema), orderController.list);

// GET /customer/orders/:id — Get order detail
router.get('/:id', validate(orderParamSchema), orderController.getById);

// POST /customer/orders/:id/cancel — Cancel order
router.post('/:id/cancel', validate(cancelOrderSchema), orderController.cancel);

// POST /customer/orders/:id/return — Request return
router.post('/:id/return', validate(returnOrderSchema), orderController.requestReturn);

export default router;
