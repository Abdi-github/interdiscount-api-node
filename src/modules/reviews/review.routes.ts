import { Router } from 'express';
import reviewController from './review.controller';
import auth from '../../shared/middlewares/auth';
import validate from '../../shared/middlewares/validate';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewParamSchema,
  listMyReviewsSchema,
} from './review.validation';

const router = Router();

// All customer review routes require authentication
router.use(auth);

router.post('/', validate(createReviewSchema), reviewController.create);
router.get('/', validate(listMyReviewsSchema), reviewController.listMine);
router.put('/:id', validate(updateReviewSchema), reviewController.update);
router.delete('/:id', validate(reviewParamSchema), reviewController.remove);

export default router;
