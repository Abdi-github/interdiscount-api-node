/**
 * Order status lifecycle constants.
 */
export const ORDER_STATUSES = {
  PLACED: 'PLACED',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  PICKED_UP: 'PICKED_UP',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  PICKUP_EXPIRED: 'PICKUP_EXPIRED',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const PAYMENT_METHODS = {
  CARD: 'card',
  TWINT: 'twint',
  POSTFINANCE: 'postfinance',
  INVOICE: 'invoice',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

/**
 * Allowed status transitions.
 * Key = current status, Value = array of valid next statuses.
 */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  [ORDER_STATUSES.PLACED]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PROCESSING]: [
    ORDER_STATUSES.SHIPPED,
    ORDER_STATUSES.READY_FOR_PICKUP,
    ORDER_STATUSES.CANCELLED,
  ],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.RETURNED],
  [ORDER_STATUSES.READY_FOR_PICKUP]: [
    ORDER_STATUSES.PICKED_UP,
    ORDER_STATUSES.PICKUP_EXPIRED,
  ],
  [ORDER_STATUSES.PICKED_UP]: [],
  [ORDER_STATUSES.CANCELLED]: [],
  [ORDER_STATUSES.RETURNED]: [],
  [ORDER_STATUSES.PICKUP_EXPIRED]: [],
};

/**
 * Statuses that allow customer cancellation.
 */
export const CANCELLABLE_STATUSES = [
  ORDER_STATUSES.PLACED,
  ORDER_STATUSES.CONFIRMED,
] as const;

/**
 * Statuses that allow customer return request.
 */
export const RETURNABLE_STATUSES = [
  ORDER_STATUSES.DELIVERED,
] as const;
