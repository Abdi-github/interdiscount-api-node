import Payment, { IPayment } from './payment.model';
import orderService from '../orders/order.service';
import notificationService from '../notifications/notification.service';
import ApiError from '../../shared/errors/ApiError';
import logger from '../../shared/logger';

class PaymentService {
  /**
   * Initiate payment for an order.
   * In production, this would create a Stripe PaymentIntent.
   * In dev mode, it simulates a payment session.
   */
  async initiate(userId: string, orderId: string): Promise<IPayment> {
    const order = await orderService.getById(orderId);

    if (!order) {
      throw ApiError.notFound('Order');
    }
    if (order.user_id.toString() !== userId) {
      throw ApiError.forbidden('Order does not belong to you');
    }
    if (order.payment_status === 'PAID') {
      throw ApiError.badRequest('Order is already paid');
    }

    // Check for existing pending payment
    const existingPayment = await Payment.findOne({
      order_id: orderId,
      status: { $in: ['PENDING', 'PROCESSING'] },
    });

    if (existingPayment) {
      // TODO: Implement payment retry logic with exponential backoff
      return existingPayment.toObject();
    }

    // In dev mode, simulate a payment intent
    // In production, this would call Stripe:
    // const paymentIntent = await stripe.paymentIntents.create({ ... })
    const simulatedIntentId = `pi_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const simulatedClientSecret = `${simulatedIntentId}_secret_${Math.random().toString(36).substring(2, 12)}`;

    const payment = await Payment.create({
      order_id: orderId,
      user_id: userId,
      amount: order.total,
      currency: order.currency,
      payment_method: order.payment_method,
      status: 'PENDING',
      stripe_payment_intent_id: simulatedIntentId,
      stripe_client_secret: simulatedClientSecret,
    });

    logger.info('Payment initiated', {
      paymentId: payment._id.toString(),
      orderId,
      amount: order.total,
      method: order.payment_method,
    });

    return payment.toObject();
  }

  /**
   * Simulate payment completion (dev mode).
   * In production, this would be triggered by Stripe webhook.
   */
  async simulatePayment(userId: string, orderId: string): Promise<IPayment> {
    const payment = await Payment.findOne({
      order_id: orderId,
      user_id: userId,
      status: { $in: ['PENDING', 'PROCESSING'] },
    });

    if (!payment) {
      throw ApiError.notFound('Pending payment for this order');
    }

    payment.status = 'SUCCEEDED';
    payment.paid_at = new Date();
    await payment.save();

    // Update order payment status
    await orderService.updatePaymentStatus(orderId, 'PAID');

    logger.info('Payment simulated as successful', {
      paymentId: payment._id.toString(),
      orderId,
    });

    return payment.toObject();
  }

  /**
   * Confirm invoice payment (manual — e.g. bank transfer reference).
   */
  async confirmInvoice(
    userId: string,
    orderId: string,
    transferNumber: string,
  ): Promise<IPayment> {
    const order = await orderService.getById(orderId);

    if (!order) {
      throw ApiError.notFound('Order');
    }
    if (order.user_id.toString() !== userId) {
      throw ApiError.forbidden('Order does not belong to you');
    }
    if (order.payment_method !== 'invoice') {
      throw ApiError.badRequest('This order does not use invoice payment');
    }
    if (order.payment_status === 'PAID') {
      throw ApiError.badRequest('Order is already paid');
    }

    // Create or update payment record
    let payment = await Payment.findOne({ order_id: orderId });

    if (payment) {
      payment.status = 'PROCESSING';
      payment.stripe_payment_intent_id = transferNumber;
      await payment.save();
    } else {
      payment = await Payment.create({
        order_id: orderId,
        user_id: userId,
        amount: order.total,
        currency: order.currency,
        payment_method: 'invoice',
        status: 'PROCESSING',
        stripe_payment_intent_id: transferNumber,
      });
    }

    logger.info('Invoice payment confirmation submitted', {
      paymentId: payment._id.toString(),
      orderId,
      transferNumber,
    });

    return payment.toObject();
  }

  /**
   * Get payment status for an order.
   */
  async getByOrderId(userId: string, orderId: string): Promise<IPayment | null> {
    const order = await orderService.getById(orderId);

    if (!order) {
      throw ApiError.notFound('Order');
    }
    if (order.user_id.toString() !== userId) {
      throw ApiError.forbidden('Order does not belong to you');
    }

    const payment = await Payment.findOne({ order_id: orderId })
      .sort({ created_at: -1 })
      .lean();

    return payment;
  }

  /**
   * Handle Stripe webhook event (production).
   * In dev mode, this is a no-op — simulate via simulatePayment instead.
   */
  async handleWebhookEvent(
    eventType: string,
    paymentIntentId: string,
    _metadata: Record<string, unknown>,
  ): Promise<void> {
    const payment = await Payment.findOne({
      stripe_payment_intent_id: paymentIntentId,
    });

    if (!payment) {
      logger.warn('Webhook: payment not found', { paymentIntentId, eventType });
      return;
    }

    const orderId = payment.order_id.toString();

    switch (eventType) {
      case 'payment_intent.succeeded':
        payment.status = 'SUCCEEDED';
        payment.paid_at = new Date();
        await payment.save();
        await orderService.updatePaymentStatus(orderId, 'PAID');
        break;

      case 'payment_intent.payment_failed':
        payment.status = 'FAILED';
        payment.failure_reason = 'Payment declined';
        await payment.save();
        await orderService.updatePaymentStatus(orderId, 'FAILED');

        // Notify customer
        try {
          await notificationService.create({
            user_id: payment.user_id.toString(),
            type: 'order_status',
            title: 'Payment Failed',
            message: 'Your payment could not be processed. Please try again.',
            data: { order_id: orderId },
          });
        } catch (err) {
          logger.error('Failed to create payment failed notification', { error: err });
        }
        break;

      case 'charge.refunded':
        payment.status = 'REFUNDED';
        payment.refunded_at = new Date();
        await payment.save();
        await orderService.updatePaymentStatus(orderId, 'REFUNDED');
        break;

      default:
        logger.info('Unhandled webhook event', { eventType });
    }

    logger.info('Webhook processed', {
      eventType,
      paymentId: payment._id.toString(),
      orderId,
    });
  }
}

export default new PaymentService();
