import { Router } from 'express';
import controller from './admin-brands.controller';
import validate from '../../shared/middlewares/validate';
import {
  listAdminBrandsSchema,
  brandIdParamSchema,
  createBrandSchema,
  updateBrandSchema,
} from './admin-brands.validation';

const router = Router();

router.get('/', validate(listAdminBrandsSchema), controller.list);
router.post('/', validate(createBrandSchema), controller.create);
router.put('/:id', validate(updateBrandSchema), controller.update);
router.delete('/:id', validate(brandIdParamSchema), controller.delete);

export default router;
