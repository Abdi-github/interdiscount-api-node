import { Router } from 'express';
import controller from './admin-locations.controller';
import validate from '../../shared/middlewares/validate';
import {
  locationIdParamSchema,
  createCantonSchema,
  updateCantonSchema,
  createCitySchema,
  updateCitySchema,
} from './admin-locations.validation';

const router = Router();

// Canton routes
router.post('/cantons', validate(createCantonSchema), controller.createCanton);
router.put('/cantons/:id', validate(updateCantonSchema), controller.updateCanton);
router.delete('/cantons/:id', validate(locationIdParamSchema), controller.deleteCanton);

// City routes
router.post('/cities', validate(createCitySchema), controller.createCity);
router.put('/cities/:id', validate(updateCitySchema), controller.updateCity);
router.delete('/cities/:id', validate(locationIdParamSchema), controller.deleteCity);

export default router;
