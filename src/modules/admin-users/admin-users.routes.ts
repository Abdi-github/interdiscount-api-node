import { Router } from 'express';
import controller from './admin-users.controller';
import validate from '../../shared/middlewares/validate';
import {
  listUsersSchema,
  userIdParamSchema,
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRolesSchema,
} from './admin-users.validation';

const router = Router();

router.get('/', validate(listUsersSchema), controller.list);
router.get('/:id', validate(userIdParamSchema), controller.getById);
router.put('/:id', validate(updateUserSchema), controller.update);
router.put('/:id/status', validate(updateUserStatusSchema), controller.updateStatus);
router.get('/:id/roles', validate(userIdParamSchema), controller.getUserRoles);
router.put('/:id/roles', validate(updateUserRolesSchema), controller.updateUserRoles);

export default router;
