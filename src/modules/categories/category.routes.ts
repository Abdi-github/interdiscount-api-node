import { Router } from 'express';
import categoryController from './category.controller';
import validate from '../../shared/middlewares/validate';
import { listCategoriesSchema } from './category.validation';

const router = Router();

router.get('/', validate(listCategoriesSchema), categoryController.list);
router.get('/product-counts', categoryController.getProductCounts);
router.get('/slug/:slug', categoryController.getBySlug);
router.get('/:id/children', categoryController.getChildren);
router.get('/:id/breadcrumb', categoryController.getBreadcrumb);
router.get('/:id', categoryController.getById);

export default router;
