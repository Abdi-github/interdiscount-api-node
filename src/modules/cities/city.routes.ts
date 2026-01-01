import { Router } from 'express';
import cityController from './city.controller';
import validate from '../../shared/middlewares/validate';
import { listCitiesSchema } from './city.validation';

const router = Router();

router.get('/', validate(listCitiesSchema), cityController.list);
router.get('/slug/:slug', cityController.getBySlug);
router.get('/postal-code/:code', cityController.getByPostalCode);
router.get('/:id', cityController.getById);

export default router;
