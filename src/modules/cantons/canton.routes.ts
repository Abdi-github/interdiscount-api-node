import { Router } from 'express';
import cantonController from './canton.controller';
import validate from '../../shared/middlewares/validate';
import { listCantonsSchema } from './canton.validation';

const router = Router();

router.get('/', validate(listCantonsSchema), cantonController.list);
router.get('/code/:code', cantonController.getByCode);
router.get('/:id', cantonController.getById);

export default router;
