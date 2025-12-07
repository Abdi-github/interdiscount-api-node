import Order, { IOrder } from '../orders/order.model';
import OrderItem from '../orders/order-item.model';
import { STATUS_TRANSITIONS } from '../orders/order.types';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class AdminOrdersService {
  /**
   * List all orders with filters.
   */
  async list(query: {
    page?: string;
    limit?: string;
    status?: string;
    payment_status?: string;
    payment_method?: string;
    user_id?: string;
    is_store_pickup?: string;
    start_date?: string;
    end_date?: string;
    q?: string;
    sort?: string;
  }): Promise<{ orders: IOrder[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.payment_status) filter.payment_status = query.payment_status;
    if (query.payment_method) filter.payment_method = query.payment_method;
    if (query.user_id) filter.user_id = query.user_id;
    if (query.is_store_pickup !== undefined) {
      filter.is_store_pickup = query.is_store_pickup === 'true';
    }
    if (query.start_date || query.end_date) {
      const dateFilter: Record<string, Date> = {};
      if (query.start_date) dateFilter.$gte = new Date(query.start_date);
      if (query.end_date) dateFilter.$lte = new Date(query.end_date);
      filter.created_at = dateFilter;
    }
    if (query.q) {
      filter.order_number = new RegExp(query.q, 'i');
    }

    let sortObj: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'oldest': sortObj = { created_at: 1 }; break;
      case 'total_asc': sortObj = { total: 1 }; break;
      case 'total_desc': sortObj = { total: -1 }; break;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user_id', 'first_name last_name email')
        .populate('store_pickup_id', 'name store_id')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return { orders, total, page, limit };
  }

  /**
   * Get order detail with items.
   */
  async getById(orderId: string): Promise<unknown> {
    const order = await Order.findById(orderId)
      .populate('user_id', 'first_name last_name email phone')
      .populate('shipping_address_id')
      .populate('billing_address_id')
      .populate('store_pickup_id', 'name store_id street postal_code phone')
      .lean();

    if (!order) {
      throw ApiError.notFound('Order');
    }

    const items = await OrderItem.find({ order_id: orderId })
      .populate('product_id', 'name slug images')
      .lean();

    return { ...order, items };
  }

  /**
   * Update order status (admin can force any valid transition).
   */
  async updateStatus(orderId: string, status: string, notes?: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order');
    }

    // Validate transition
    const allowedTransitions = STATUS_TRANSITIONS[order.status];
    if (allowedTransitions && !allowedTransitions.includes(status)) {
      throw ApiError.badRequest(
        `Cannot transition from ${order.status} to ${status}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
      );
    }

    order.status = status as IOrder['status'];

    // Set timestamps based on new status
    if (status === 'DELIVERED') {
      order.delivered_at = new Date();
    } else if (status === 'CANCELLED') {
      order.cancelled_at = new Date();
      if (notes) order.cancellation_reason = notes;
    }

    if (notes) {
      order.notes = (order.notes ? order.notes + '\n' : '') + `[Admin] ${notes}`;
    }

    await order.save();
    logger.info('Admin updated order status', { orderId, status });

    return order.toObject();
  }

  /**
   * Export orders as CSV or JSON.
   */
  async export(query: {
    status?: string;
    payment_status?: string;
    start_date?: string;
    end_date?: string;
    format?: string;
  }): Promise<{ data: string; contentType: string; filename: string }> {
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.payment_status) filter.payment_status = query.payment_status;
    if (query.start_date || query.end_date) {
      const dateFilter: Record<string, Date> = {};
      if (query.start_date) dateFilter.$gte = new Date(query.start_date);
      if (query.end_date) dateFilter.$lte = new Date(query.end_date);
      filter.created_at = dateFilter;
    }

    const orders = await Order.find(filter)
      .populate('user_id', 'first_name last_name email')
      .sort({ created_at: -1 })
      .lean();

    const timestamp = new Date().toISOString().slice(0, 10);

    if (query.format === 'json') {
      return {
        data: JSON.stringify(orders, null, 2),
        contentType: 'application/json',
        filename: `orders-${timestamp}.json`,
      };
    }

    // CSV format
    const headers = [
      'order_number', 'customer_email', 'customer_name', 'status',
      'payment_status', 'payment_method', 'subtotal', 'shipping_fee',
      'discount', 'total', 'currency', 'is_store_pickup', 'created_at',
    ];

    const rows = orders.map((order) => {
      const customer = order.user_id as unknown as { email: string; first_name: string; last_name: string };
      return [
        order.order_number,
        customer?.email || '',
        customer ? `${customer.first_name} ${customer.last_name}` : '',
        order.status,
        order.payment_status,
        order.payment_method,
        order.subtotal,
        order.shipping_fee,
        order.discount,
        order.total,
        order.currency,
        order.is_store_pickup,
        order.created_at?.toISOString() || '',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return {
      data: csv,
      contentType: 'text/csv',
      filename: `orders-${timestamp}.csv`,
    };
  }
}

export default new AdminOrdersService();
