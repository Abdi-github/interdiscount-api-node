import Order from '../../orders/order.model';
import OrderItem from '../../orders/order-item.model';
import User from '../../users/user.model';
import Store from '../../stores/store.model';
import storeInventoryService from '../inventory/store-inventory.service';
import notificationService from '../../notifications/notification.service';
import { emailQueue } from '../../../shared/queue/email.queue';
import ApiError from '../../../shared/errors/ApiError';
import { parsePagination } from '../../../shared/utils/formatters';
import logger from '../../../shared/logger';
import { ORDER_STATUSES } from '../../orders/order.types';
import { IOrder } from '../../orders/order.model';

/**
 * Store Pickup Service — manages click & collect order queue for store managers.
 */
class StorePickupService {
  /**
   * List pickup orders for a store.
   */
  async list(
    storeId: string,
    query: { page?: string; limit?: string; status?: string; sort?: string },
  ): Promise<{ orders: IOrder[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });

    const filter: Record<string, unknown> = {
      store_pickup_id: storeId,
      is_store_pickup: true,
    };

    if (query.status) {
      filter.status = query.status;
    }

    // Default sort: newest first
    let sortObj: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'oldest':
        sortObj = { created_at: 1 };
        break;
      case 'status':
        sortObj = { status: 1, created_at: -1 };
        break;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user_id', 'first_name last_name email phone')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return { orders: orders as unknown as IOrder[], total, page, limit };
  }

  /**
   * Get pickup order detail with items.
   */
  async getById(storeId: string, orderId: string): Promise<{ order: IOrder; items: unknown[] }> {
    const order = await Order.findOne({
      _id: orderId,
      store_pickup_id: storeId,
      is_store_pickup: true,
    })
      .populate('user_id', 'first_name last_name email phone')
      .populate('shipping_address_id')
      .lean();

    if (!order) {
      throw ApiError.notFound('Pickup order not found at your store');
    }

    const items = await OrderItem.find({ order_id: orderId })
      .populate('product_id', 'name name_short slug images code displayed_code')
      .lean();

    return { order: order as unknown as IOrder, items };
  }

  /**
   * Confirm order — start preparing (PLACED/CONFIRMED → PROCESSING).
   */
  async confirmOrder(storeId: string, orderId: string): Promise<IOrder> {
    const order = await Order.findOne({
      _id: orderId,
      store_pickup_id: storeId,
      is_store_pickup: true,
    });

    if (!order) {
      throw ApiError.notFound('Pickup order not found at your store');
    }

    if (order.status !== ORDER_STATUSES.PLACED && order.status !== ORDER_STATUSES.CONFIRMED) {
      throw ApiError.badRequest(
        `Cannot confirm order in status "${order.status}". Must be PLACED or CONFIRMED.`,
      );
    }

    order.status = ORDER_STATUSES.PROCESSING;
    await order.save();

    // Notify customer
    await notificationService.create({
      user_id: order.user_id.toString(),
      type: 'order_update',
      title: 'Order Being Prepared',
      message: `Your order ${order.order_number} is being prepared at the store.`,
      data: { order_id: orderId, order_number: order.order_number, status: ORDER_STATUSES.PROCESSING },
    });

    logger.info(`Pickup order confirmed: ${order.order_number} at store ${storeId}`);

    return order.toObject() as unknown as IOrder;
  }

  /**
   * Mark order as ready for pickup (PROCESSING → READY_FOR_PICKUP).
   */
  async markReady(storeId: string, orderId: string): Promise<IOrder> {
    const order = await Order.findOne({
      _id: orderId,
      store_pickup_id: storeId,
      is_store_pickup: true,
    });

    if (!order) {
      throw ApiError.notFound('Pickup order not found at your store');
    }

    if (order.status !== ORDER_STATUSES.PROCESSING) {
      throw ApiError.badRequest(
        `Cannot mark as ready from status "${order.status}". Must be PROCESSING.`,
      );
    }

    order.status = ORDER_STATUSES.READY_FOR_PICKUP;
    await order.save();

    // Notify customer their order is ready
    await notificationService.create({
      user_id: order.user_id.toString(),
      type: 'order_update',
      title: 'Order Ready for Pickup!',
      message: `Your order ${order.order_number} is ready for collection. Please pick it up within 5 business days.`,
      data: { order_id: orderId, order_number: order.order_number, status: ORDER_STATUSES.READY_FOR_PICKUP },
    });

    // Queue pickup ready email
    try {
      const user = await User.findById(order.user_id).lean();
      const store = await Store.findById(storeId).lean();
      if (user && store) {
        await emailQueue.add('pickup_ready', {
          type: 'pickup_ready',
          to: user.email,
          firstName: user.first_name,
          orderNumber: order.order_number,
          storeName: store.name,
          language: user.preferred_language || 'de',
        });
      }
    } catch (err) {
      logger.error('Failed to queue pickup ready email', { error: err });
    }

    logger.info(`Pickup order ready: ${order.order_number} at store ${storeId}`);

    return order.toObject() as unknown as IOrder;
  }

  /**
   * Mark order as collected by customer (READY_FOR_PICKUP → PICKED_UP).
   */
  async markCollected(storeId: string, orderId: string): Promise<IOrder> {
    const order = await Order.findOne({
      _id: orderId,
      store_pickup_id: storeId,
      is_store_pickup: true,
    });

    if (!order) {
      throw ApiError.notFound('Pickup order not found at your store');
    }

    if (order.status !== ORDER_STATUSES.READY_FOR_PICKUP) {
      throw ApiError.badRequest(
        `Cannot mark as collected from status "${order.status}". Must be READY_FOR_PICKUP.`,
      );
    }

    order.status = ORDER_STATUSES.PICKED_UP;
    order.delivered_at = new Date();
    await order.save();

    // Release reserved stock — decrement both quantity and reserved
    const items = await OrderItem.find({ order_id: orderId }).lean();
    for (const item of items) {
      await storeInventoryService.collectStock(
        storeId,
        item.product_id.toString(),
        item.quantity,
      );
    }

    // Notify customer
    await notificationService.create({
      user_id: order.user_id.toString(),
      type: 'order_update',
      title: 'Order Collected',
      message: `Your order ${order.order_number} has been successfully collected. Thank you!`,
      data: { order_id: orderId, order_number: order.order_number, status: ORDER_STATUSES.PICKED_UP },
    });

    logger.info(`Pickup order collected: ${order.order_number} at store ${storeId}`);

    return order.toObject() as unknown as IOrder;
  }

  /**
   * Cancel pickup order (store manager cancels — item unavailable, etc.).
   */
  async cancelOrder(storeId: string, orderId: string, reason: string): Promise<IOrder> {
    const order = await Order.findOne({
      _id: orderId,
      store_pickup_id: storeId,
      is_store_pickup: true,
    });

    if (!order) {
      throw ApiError.notFound('Pickup order not found at your store');
    }

    const cancellableStatuses: string[] = [
      ORDER_STATUSES.PLACED,
      ORDER_STATUSES.CONFIRMED,
      ORDER_STATUSES.PROCESSING,
      ORDER_STATUSES.READY_FOR_PICKUP,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      throw ApiError.badRequest(
        `Cannot cancel order in status "${order.status}".`,
      );
    }

    order.status = ORDER_STATUSES.CANCELLED;
    order.cancelled_at = new Date();
    order.cancellation_reason = `Store cancelled: ${reason}`;
    await order.save();

    // Release reserved stock
    const items = await OrderItem.find({ order_id: orderId }).lean();
    for (const item of items) {
      await storeInventoryService.releaseReservedStock(
        storeId,
        item.product_id.toString(),
        item.quantity,
      );
    }

    // Notify customer about cancellation
    await notificationService.create({
      user_id: order.user_id.toString(),
      type: 'order_update',
      title: 'Pickup Order Cancelled',
      message: `Your order ${order.order_number} has been cancelled by the store. Reason: ${reason}`,
      data: { order_id: orderId, order_number: order.order_number, status: ORDER_STATUSES.CANCELLED, reason },
    });

    logger.info(`Pickup order cancelled: ${order.order_number} at store ${storeId}, reason: ${reason}`);

    return order.toObject() as unknown as IOrder;
  }
}

export default new StorePickupService();
