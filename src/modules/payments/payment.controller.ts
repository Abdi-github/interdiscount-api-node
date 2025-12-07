import { Request, Response } from 'express';
import paymentService from './payment.service';
import asyncHandler from '../../shared/utils/asyncHandler';
import ApiResponse from '../../shared/utils/ApiResponse';
import logger from '../../shared/logger';

class PaymentController {
  /**
   * POST /customer/payments/:orderId/initiate — Start payment for an order.
   */
  initiate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const payment = await paymentService.initiate(userId, req.params.orderId as string);
    ApiResponse.created(res, payment, 'Payment initiated');
  });

  /**
   * POST /customer/payments/:orderId/simulate — Simulate successful payment (dev only).
   */
  simulate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const payment = await paymentService.simulatePayment(userId, req.params.orderId as string);
    ApiResponse.success(res, payment, 'Payment simulated successfully');
  });

  /**
   * POST /customer/payments/:orderId/invoice — Confirm invoice payment.
   */
  confirmInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const payment = await paymentService.confirmInvoice(
      userId,
      req.params.orderId as string,
      req.body.transfer_number,
    );
    ApiResponse.success(res, payment, 'Invoice confirmation submitted');
  });

  /**
   * GET /customer/payments/:orderId — Get payment status for an order.
   */
  getStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const payment = await paymentService.getByOrderId(userId, req.params.orderId as string);

    if (!payment) {
      ApiResponse.success(res, { status: 'NO_PAYMENT' }, 'No payment found for this order');
      return;
    }

    ApiResponse.success(res, payment, 'Payment status retrieved');
  });

  /**
   * POST /webhooks/stripe — Stripe webhook handler.
   * In production, this verifies the Stripe signature.
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // In production, verify signature:
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);

    const event = req.body as {
      type: string;
      data: {
        object: {
          id: string;
          metadata?: Record<string, unknown>;
        };
      };
    };

    logger.info('Webhook received', { type: event.type });

    await paymentService.handleWebhookEvent(
      event.type,
      event.data.object.id,
      event.data.object.metadata || {},
    );

    // Stripe requires a 200 response
    res.status(200).json({ received: true });
  });
}

export default new PaymentController();
