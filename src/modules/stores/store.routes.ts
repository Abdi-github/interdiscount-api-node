import { Router } from 'express';
import storeController from './store.controller';
import validate from '../../shared/middlewares/validate';
import { listStoresSchema } from './store.validation';

const router = Router();

router.get('/', validate(listStoresSchema), storeController.list);
router.get('/slug/:slug', storeController.getBySlug);
router.get('/:id', storeController.getById);

export default router;
