import { Router } from 'express';
import controller from './admin-categories.controller';
import validate from '../../shared/middlewares/validate';
import {
  listAdminCategoriesSchema,
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
} from './admin-categories.validation';

const router = Router();

router.get('/', validate(listAdminCategoriesSchema), controller.list);
router.post('/', validate(createCategorySchema), controller.create);
router.put('/reorder', validate(reorderCategoriesSchema), controller.reorder);
router.put('/:id', validate(updateCategorySchema), controller.update);
router.delete('/:id', validate(categoryIdParamSchema), controller.delete);

export default router;
