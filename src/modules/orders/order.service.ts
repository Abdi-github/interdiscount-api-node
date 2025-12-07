import mongoose from 'mongoose';
import Order, { IOrder } from './order.model';
import OrderItem, { IOrderItem } from './order-item.model';
import Product from '../products/product.model';
import Address from '../addresses/address.model';
import Store from '../stores/store.model';
import Coupon from '../coupons/coupon.model';
import User from '../users/user.model';
import couponService from '../coupons/coupon.service';
import notificationService from '../notifications/notification.service';
import { emailQueue } from '../../shared/queue/email.queue';
import ApiError from '../../shared/errors/ApiError';
import { generateOrderNumber, parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';
import {
  ORDER_STATUSES,
  CANCELLABLE_STATUSES,
  RETURNABLE_STATUSES,
} from './order.types';

/**
 * Shipping fee logic for Switzerland.
 */
const SHIPPING_FEE = 9.90; // CHF flat rate
const FREE_SHIPPING_THRESHOLD = 49; // Free shipping above CHF 49

interface IOrderItemInput {
  product_id: string;
  quantity: number;
}

interface ICreateOrderInput {
  items: IOrderItemInput[];
  shipping_address_id: string;
  billing_address_id: string;
  payment_method: string;
  coupon_code?: string;
  notes?: string;
  is_store_pickup?: boolean;
  store_pickup_id?: string;
}

interface IOrderWithItems extends IOrder {
  items?: IOrderItem[];
}

class OrderService {
  /**
   * Create a new order.
   */
  async create(userId: string, input: ICreateOrderInput): Promise<IOrderWithItems> {
    
    // 1. Validate addresses belong to user
    const [shippingAddress, billingAddress] = await Promise.all([
      Address.findOne({ _id: input.shipping_address_id, user_id: userId }).lean(),
      Address.findOne({ _id: input.billing_address_id, user_id: userId }).lean(),
    ]);

    if (!shippingAddress) {
      throw ApiError.badRequest('Shipping address not found or does not belong to you');
    }
    if (!billingAddress) {
      throw ApiError.badRequest('Billing address not found or does not belong to you');
    }

    /* console.log('Addresses validated'); */

    // 2. Validate store pickup if applicable
    if (input.is_store_pickup && input.store_pickup_id) {
      const store = await Store.findOne({
        _id: input.store_pickup_id,
        is_active: true,
      }).lean();
      if (!store) {
        throw ApiError.badRequest('Store not found or not active');
      }
    }

    // 3. Validate all products and calculate totals
    const productIds = input.items.map((item) => new mongoose.Types.ObjectId(item.product_id));
    const products = await Product.find({
      _id: { $in: productIds },
      is_active: true,
      is_orderable: true,
    }).lean();

    if (products.length !== input.items.length) {
      const foundIds = new Set(products.map((p) => p._id.toString()));
      const missingIds = input.items
        .filter((item) => !foundIds.has(item.product_id))
        .map((item) => item.product_id);
      // TODO: Add detailed inventory checking endpoint
      throw ApiError.badRequest(`Products not available: ${missingIds.join(', ')}`);
    }


    // Create product lookup map
    const productMap = new Map(
      products.map((p) => [p._id.toString(), p]),
    );

    // Build order items and calculate subtotal
    const orderItems: Array<{
      product_id: mongoose.Types.ObjectId;
      product_name: string;
      product_code: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      currency: string;
    }> = [];

    let subtotal = 0;

    for (const item of input.items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw ApiError.badRequest(`Product ${item.product_id} not found`);
      }

      // Check availability
      if (product.availability_state === 'OUTOFSTOCK' || product.availability_state === 'DISCONTINUED') {
        throw ApiError.badRequest(
          `Product "${product.name}" is not available (${product.availability_state})`,
        );
      }

      const totalPrice = product.price * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product_id: new mongoose.Types.ObjectId(item.product_id),
        product_name: product.name,
        product_code: product.code || product.displayed_code || '',
        quantity: item.quantity,
        unit_price: product.price,
        total_price: Math.round(totalPrice * 100) / 100,
        currency: 'CHF',
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    /* console.log('Subtotal calculated:', subtotal, 'items:', orderItems.length); */

    // 4. Calculate shipping fee
    let shippingFee = 0;
    if (!input.is_store_pickup) {
      shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    }

    // 5. Apply coupon discount
    let discount = 0;
    let couponCode: string | null = null;
    if (input.coupon_code) {
      const validation = await couponService.validate(input.coupon_code, subtotal);
      if (validation.valid && validation.discount_amount) {
        discount = Math.round(validation.discount_amount * 100) / 100;
        couponCode = input.coupon_code.toUpperCase();
      }
    }

    // 6. Calculate total
    const total = Math.round((subtotal + shippingFee - discount) * 100) / 100;

    // 7. Calculate estimated delivery
    let estimatedDelivery: Date | null = null;
    if (!input.is_store_pickup) {
      const maxDeliveryDays = Math.max(
        ...products.map((p) => p.delivery_days || 3),
      );
      estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + maxDeliveryDays);
    }

    // 8. Create order and items
    const order = await Order.create({
      order_number: generateOrderNumber(),
      user_id: userId,
      shipping_address_id: input.shipping_address_id,
      billing_address_id: input.billing_address_id,
      status: ORDER_STATUSES.PLACED,
      payment_method: input.payment_method,
      payment_status: 'PENDING',
      subtotal,
      shipping_fee: shippingFee,
      discount,
      total,
      currency: 'CHF',
      coupon_code: couponCode,
      notes: input.notes || '',
      is_store_pickup: input.is_store_pickup || false,
      store_pickup_id: input.store_pickup_id || null,
      estimated_delivery: estimatedDelivery,
    });

    /* console.log('Order created - ID:', order._id, 'Number:', order.order_number); */

    // Create order items
    const itemDocs = orderItems.map((item) => ({
      ...item,
      order_id: order._id,
    }));
    const items = await OrderItem.create(itemDocs);

    // Increment coupon usage if applied
    if (couponCode) {
      await Coupon.updateOne(
        { code: couponCode },
        { $inc: { used_count: 1 } },
      );
    }

    // 9. Send order placed notification
    try {
      await notificationService.create({
        user_id: userId,
        type: 'order_status',
        title: 'Order Placed',
        message: `Your order ${order.order_number} has been placed successfully.`,
        data: { order_id: order._id.toString(), order_number: order.order_number },
      });

      // Queue order confirmation email
      const user = await User.findById(userId).lean();
      if (user) {
        let storeName: string | undefined;
        if (input.is_store_pickup && input.store_pickup_id) {
          const store = await Store.findById(input.store_pickup_id).lean();
          storeName = store?.name;
        }
        await emailQueue.add('order_confirmation', {
          type: 'order_confirmation',
          to: user.email,
          firstName: user.first_name,
          orderNumber: order.order_number,
          total,
          currency: 'CHF',
          isStorePickup: input.is_store_pickup || false,
          storeName,
          language: user.preferred_language || 'de',
        });
      }
    } catch (err) {
      logger.error('Failed to create order notification', { error: err });
    }

    logger.info('Order created', {
      userId,
      orderId: order._id.toString(),
      orderNumber: order.order_number,
      total,
      itemCount: items.length,
    });

    const result = order.toObject() as IOrderWithItems;
    result.items = items.map((i) => i.toObject());
    return result;
  }

  /**
   * List orders for a customer.
   */
  async listByUser(
    userId: string,
    query: {
      page?: string;
      limit?: string;
      status?: string;
      payment_status?: string;
      sort?: string;
    },
  ): Promise<{
    orders: IOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { user_id: userId };

    if (query.status) {
      filter.status = query.status.toUpperCase();
    }
    if (query.payment_status) {
      filter.payment_status = query.payment_status.toUpperCase();
    }

    // Sort
    let sort: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'oldest':
        sort = { created_at: 1 };
        break;
      case 'total_asc':
        sort = { total: 1 };
        break;
      case 'total_desc':
        sort = { total: -1 };
        break;
      default:
        sort = { created_at: -1 };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
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
  async getByIdForUser(userId: string, orderId: string): Promise<IOrderWithItems> {
    const order = await Order.findOne({
      _id: orderId,
      user_id: userId,
    }).lean();

    if (!order) {
      throw ApiError.notFound('Order');
    }

    const items = await OrderItem.find({ order_id: orderId }).lean();

    return { ...order, items } as unknown as IOrderWithItems;
  }

  /**
   * Cancel an order (customer).
   */
  async cancel(userId: string, orderId: string, reason: string): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, user_id: userId });

    if (!order) {
      throw ApiError.notFound('Order');
    }

    if (!CANCELLABLE_STATUSES.includes(order.status as typeof CANCELLABLE_STATUSES[number])) {
      throw ApiError.badRequest(
        `Order cannot be cancelled in status "${order.status}". Only orders in PLACED or CONFIRMED status can be cancelled.`,
      );
    }

    order.status = ORDER_STATUSES.CANCELLED;
    order.cancelled_at = new Date();
    order.cancellation_reason = reason;

    // If payment was made, set for refund
    if (order.payment_status === 'PAID') {
      order.payment_status = 'REFUNDED';
    }

    await order.save();

    // Send cancellation notification
    try {
      await notificationService.create({
        user_id: userId,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: `Your order ${order.order_number} has been cancelled.`,
        data: { order_id: order._id.toString(), order_number: order.order_number },
      });
    } catch (err) {
      logger.error('Failed to create cancellation notification', { error: err });
    }

    logger.info('Order cancelled', {
      userId,
      orderId: order._id.toString(),
      reason,
    });

    return order.toObject();
  }

  /**
   * Request return for a delivered order.
   */
  async requestReturn(userId: string, orderId: string, reason: string): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, user_id: userId });

    if (!order) {
      throw ApiError.notFound('Order');
    }

    if (!RETURNABLE_STATUSES.includes(order.status as typeof RETURNABLE_STATUSES[number])) {
      throw ApiError.badRequest(
        `Return can only be requested for delivered orders. Current status: "${order.status}".`,
      );
    }

    // Check 14-day return window
    if (order.delivered_at) {
      const daysSinceDelivery = Math.floor(
        (Date.now() - new Date(order.delivered_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceDelivery > 14) {
        throw ApiError.badRequest(
          'Return window has expired. Returns must be requested within 14 days of delivery.',
        );
      }
    }

    order.status = ORDER_STATUSES.RETURNED;
    order.cancellation_reason = reason; // Reuse field for return reason
    await order.save();

    // Send return notification
    try {
      await notificationService.create({
        user_id: userId,
        type: 'order_status',
        title: 'Return Requested',
        message: `Return requested for order ${order.order_number}.`,
        data: { order_id: order._id.toString(), order_number: order.order_number },
      });
    } catch (err) {
      logger.error('Failed to create return notification', { error: err });
    }

    logger.info('Return requested', {
      userId,
      orderId: order._id.toString(),
      reason,
    });

    return order.toObject();
  }

  /**
   * Get order by ID (internal use — no user check).
   */
  async getById(orderId: string): Promise<IOrder | null> {
    return Order.findById(orderId).lean();
  }

  /**
   * Update order status (used by payment/admin services).
   */
  async updateStatus(
    orderId: string,
    status: string,
    additionalFields?: Partial<IOrder>,
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order');
    }

    order.status = status;
    if (additionalFields) {
      Object.assign(order, additionalFields);
    }
    await order.save();

    return order.toObject();
  }

  /**
   * Update payment status (used by payment webhook handlers).
   */
  async updatePaymentStatus(orderId: string, paymentStatus: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order');
    }

    order.payment_status = paymentStatus;

    // Auto-confirm order when payment is confirmed
    if (paymentStatus === 'PAID' && order.status === ORDER_STATUSES.PLACED) {
      order.status = ORDER_STATUSES.CONFIRMED;
    }

    await order.save();

    // Send payment confirmation notification
    if (paymentStatus === 'PAID') {
      try {
        await notificationService.create({
          user_id: order.user_id.toString(),
          type: 'order_confirmed',
          title: 'Payment Confirmed',
          message: `Payment for order ${order.order_number} has been confirmed.`,
          data: { order_id: order._id.toString(), order_number: order.order_number },
        });
      } catch (err) {
        logger.error('Failed to create payment notification', { error: err });
      }
    }

    logger.info('Payment status updated', {
      orderId: order._id.toString(),
      paymentStatus,
      orderStatus: order.status,
    });

    return order.toObject();
  }
}

export default new OrderService();
