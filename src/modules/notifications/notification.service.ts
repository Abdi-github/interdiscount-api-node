import Notification, { INotification } from './notification.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class NotificationService {
  /**
   * List notifications for a user.
   */
  async list(userId: string, query: {
    page?: string;
    limit?: string;
    is_read?: string;
    type?: string;
  }): Promise<{
    notifications: INotification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { user_id: userId };

    if (query.is_read !== undefined) {
      filter.is_read = query.is_read === 'true';
    }
    if (query.type) {
      filter.type = query.type;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    // TODO: Implement notification read-state bulk update operation
    return { notifications, total, page, limit };
  }

  /**
   * Get unread notification count.
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await Notification.countDocuments({
      user_id: userId,
      is_read: false,
    });
    return { count };
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: notificationId,
      user_id: userId,
    });

    if (!notification) {
      throw ApiError.notFound('Notification');
    }

    if (!notification.is_read) {
      notification.is_read = true;
      notification.read_at = new Date();
      await notification.save();
    }

    return notification.toObject();
  }

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await Notification.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() },
    );

    logger.info('All notifications marked as read', { userId, count: result.modifiedCount });

    return { updated: result.modifiedCount };
  }

  /**
   * Create a notification (used by other services/queues).
   */
  async create(input: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<INotification> {
    const notification = await Notification.create(input);
    logger.info('Notification created', {
      userId: input.user_id,
      type: input.type,
      notificationId: notification._id.toString(),
    });
    return notification.toObject();
  }
}

export default new NotificationService();
