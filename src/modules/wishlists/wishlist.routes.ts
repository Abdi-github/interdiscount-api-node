import { Router } from 'express';
import wishlistController from './wishlist.controller';
import auth from '../../shared/middlewares/auth';
import validate from '../../shared/middlewares/validate';
import { wishlistListSchema, wishlistProductParamSchema } from './wishlist.validation';

const router = Router();

// All wishlist routes require authentication
router.use(auth);

router.get('/', validate(wishlistListSchema), wishlistController.list);
router.get('/check/:productId', validate(wishlistProductParamSchema), wishlistController.check);
router.post('/:productId', validate(wishlistProductParamSchema), wishlistController.add);
router.delete('/:productId', validate(wishlistProductParamSchema), wishlistController.remove);

export default router;
