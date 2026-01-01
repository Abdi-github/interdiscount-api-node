import { Router } from 'express';
import addressController from './address.controller';
import auth from '../../shared/middlewares/auth';
import validate from '../../shared/middlewares/validate';
import {
  createAddressSchema,
  updateAddressSchema,
  addressParamSchema,
} from './address.validation';

const router = Router();

// All address routes require authentication
router.use(auth);

router.get('/', addressController.list);
router.post('/', validate(createAddressSchema), addressController.create);
router.put('/:id', validate(updateAddressSchema), addressController.update);
router.delete('/:id', validate(addressParamSchema), addressController.remove);
router.put('/:id/default', validate(addressParamSchema), addressController.setDefault);

export default router;
