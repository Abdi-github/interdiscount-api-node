import { Router } from 'express';
import brandController from './brand.controller';
import validate from '../../shared/middlewares/validate';
import { listBrandsSchema } from './brand.validation';

const router = Router();

router.get('/', validate(listBrandsSchema), brandController.list);
router.get('/slug/:slug', brandController.getBySlug);
router.get('/:id', brandController.getById);

export default router;
