import { Router } from 'express';
import controller from './admin-products.controller';
import validate from '../../shared/middlewares/validate';
import upload from '../../shared/middlewares/upload';
import {
  listAdminProductsSchema,
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
  deleteProductImageSchema,
} from './admin-products.validation';

const router = Router();

router.get('/', validate(listAdminProductsSchema), controller.list);
router.post('/', validate(createProductSchema), controller.create);
router.get('/:id', validate(productIdParamSchema), controller.getById);
router.put('/:id', validate(updateProductSchema), controller.update);
router.put('/:id/status', validate(updateProductStatusSchema), controller.updateStatus);
router.post('/:id/images', upload.array('images', 10), controller.uploadImages);
router.delete('/:id/images/:imageId', validate(deleteProductImageSchema), controller.deleteImage);

export default router;
