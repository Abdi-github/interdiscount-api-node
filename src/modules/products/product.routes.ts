import { Router } from 'express';
import productController from './product.controller';
import reviewController from '../reviews/review.controller';
import validate from '../../shared/middlewares/validate';
import { listProductsSchema } from './product.validation';
import { listProductReviewsSchema } from '../reviews/review.validation';

const router = Router();

router.get('/', validate(listProductsSchema), productController.list);
router.get('/slug/:slug', productController.getBySlug);
router.get('/:id/reviews', validate(listProductReviewsSchema), reviewController.listProductReviews);
router.get('/:id/related', productController.getRelated);
router.get('/:id', productController.getById);

export default router;
