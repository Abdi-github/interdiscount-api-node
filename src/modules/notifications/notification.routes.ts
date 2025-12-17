import { Router } from 'express';
import notificationController from './notification.controller';
import auth from '../../shared/middlewares/auth';
import validate from '../../shared/middlewares/validate';
import {
  listNotificationsSchema,
  notificationParamSchema,
} from './notification.validation';

const router = Router();

// All notification routes require authentication
router.use(auth);

router.get('/', validate(listNotificationsSchema), notificationController.list);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', validate(notificationParamSchema), notificationController.markAsRead);

export default router;
