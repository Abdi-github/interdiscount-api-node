import { Router } from 'express';
import controller from './admin-reviews.controller';
import validate from '../../shared/middlewares/validate';
import {
  listAdminReviewsSchema,
  reviewIdParamSchema,
  approveReviewSchema,
} from './admin-reviews.validation';

const router = Router();

router.get('/', validate(listAdminReviewsSchema), controller.list);
router.get('/:id', validate(reviewIdParamSchema), controller.getById);
router.put('/:id/approve', validate(approveReviewSchema), controller.approve);
router.delete('/:id', validate(reviewIdParamSchema), controller.delete);

export default router;
