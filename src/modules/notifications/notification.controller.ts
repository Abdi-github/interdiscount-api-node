import { Request, Response } from 'express';
import notificationService from './notification.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * GET /api/v1/customer/notifications
 */
const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { notifications, total, page, limit } = await notificationService.list(
    req.user!._id,
    req.query as { page?: string; limit?: string; is_read?: string; type?: string },
  );
  ApiResponse.paginated(res, notifications, total, page, limit, 'Notifications retrieved');
});

/**
 * GET /api/v1/customer/notifications/unread-count
 */
const getUnreadCount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await notificationService.getUnreadCount(req.user!._id);
  ApiResponse.success(res, result, 'Unread count retrieved');
});

/**
 * PUT /api/v1/customer/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const notification = await notificationService.markAsRead(
    req.user!._id,
    req.params.id as string,
  );
  ApiResponse.success(res, notification, 'Notification marked as read');
});

/**
 * PUT /api/v1/customer/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await notificationService.markAllAsRead(req.user!._id);
  ApiResponse.success(res, result, 'All notifications marked as read');
});

export default { list, getUnreadCount, markAsRead, markAllAsRead };
