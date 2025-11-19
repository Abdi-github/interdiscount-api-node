import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  removeAvatar,
} from './user.controller';
import auth from '../../shared/middlewares/auth';
import validate from '../../shared/middlewares/validate';
import upload from '../../shared/middlewares/upload';
import { updateProfileSchema, changePasswordSchema } from './user.validation';

const router = Router();

// All customer profile routes require authentication
router.use(auth);

router.get('/me', getProfile);
router.put('/me', validate(updateProfileSchema), updateProfile);
router.put('/me/password', validate(changePasswordSchema), changePassword);
router.put('/me/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/me/avatar', removeAvatar);

export default router;
