import { z } from 'zod/v4';

/**
 * Initiate payment for an order.
 */
export const initiatePaymentSchema = z.object({
  params: z.object({
    orderId: z.string().min(1),
  }),
});

/**
 * Payment param schema.
 */
export const paymentParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

/**
 * Confirm invoice payment (simulate for dev).
 */
export const confirmInvoiceSchema = z.object({
  params: z.object({
    orderId: z.string().min(1),
  }),
  body: z.object({
    transfer_number: z.string().min(1, 'Transfer number is required'),
  }),
});
