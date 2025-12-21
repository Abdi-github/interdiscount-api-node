import logger from './index';

/**
 * Audit logger for tracking critical administrative and security-sensitive actions.
 *
 * All audit log entries include:
 * - action: What happened (e.g., "USER_ROLE_CHANGED", "PRODUCT_DELETED")
 * - actor: Who performed the action (user ID + email)
 * - target: What was affected (resource type + ID)
 * - details: Additional context
 * - requestId: Request correlation ID
 * - timestamp: ISO string (added by Winston)
 *
 * Audit logs are written at 'info' level with a structured format
 * that can be parsed by log aggregation tools.
 */

interface IAuditEntry {
  action: string;
  actor: {
    id: string;
    email: string;
    roles?: string[];
  };
  target?: {
    type: string;
    id?: string;
    name?: string;
  };
  details?: Record<string, unknown>;
  requestId?: string;
  ip?: string;
}

// Action constants for consistent logging
export const AUDIT_ACTIONS = {
  // Authentication
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_REGISTER: 'AUTH_REGISTER',
  AUTH_PASSWORD_RESET: 'AUTH_PASSWORD_RESET',
  AUTH_EMAIL_VERIFIED: 'AUTH_EMAIL_VERIFIED',
  AUTH_TOKEN_REFRESHED: 'AUTH_TOKEN_REFRESHED',

  // User management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_DELETED: 'USER_DELETED',

  // Product management
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  PRODUCT_STATUS_CHANGED: 'PRODUCT_STATUS_CHANGED',
  PRODUCT_IMAGE_UPLOADED: 'PRODUCT_IMAGE_UPLOADED',
  PRODUCT_IMAGE_DELETED: 'PRODUCT_IMAGE_DELETED',

  // Order management
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_RETURNED: 'ORDER_RETURNED',

  // Payment
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',

  // Store management
  STORE_CREATED: 'STORE_CREATED',
  STORE_UPDATED: 'STORE_UPDATED',
  STORE_DEACTIVATED: 'STORE_DEACTIVATED',
  STORE_STAFF_ASSIGNED: 'STORE_STAFF_ASSIGNED',
  STORE_STAFF_REMOVED: 'STORE_STAFF_REMOVED',

  // Inventory
  INVENTORY_UPDATED: 'INVENTORY_UPDATED',
  INVENTORY_BULK_UPDATED: 'INVENTORY_BULK_UPDATED',
  STOCK_TRANSFER_REQUESTED: 'STOCK_TRANSFER_REQUESTED',
  STOCK_TRANSFER_APPROVED: 'STOCK_TRANSFER_APPROVED',
  STOCK_TRANSFER_SHIPPED: 'STOCK_TRANSFER_SHIPPED',
  STOCK_TRANSFER_RECEIVED: 'STOCK_TRANSFER_RECEIVED',
  STOCK_TRANSFER_CANCELLED: 'STOCK_TRANSFER_CANCELLED',

  // Pickup orders
  PICKUP_ORDER_CONFIRMED: 'PICKUP_ORDER_CONFIRMED',
  PICKUP_ORDER_READY: 'PICKUP_ORDER_READY',
  PICKUP_ORDER_COLLECTED: 'PICKUP_ORDER_COLLECTED',
  PICKUP_ORDER_CANCELLED: 'PICKUP_ORDER_CANCELLED',

  // Reviews
  REVIEW_APPROVED: 'REVIEW_APPROVED',
  REVIEW_REJECTED: 'REVIEW_REJECTED',
  REVIEW_DELETED: 'REVIEW_DELETED',

  // Coupons
  COUPON_CREATED: 'COUPON_CREATED',
  COUPON_UPDATED: 'COUPON_UPDATED',
  COUPON_DELETED: 'COUPON_DELETED',

  // RBAC
  ROLE_CREATED: 'ROLE_CREATED',
  ROLE_UPDATED: 'ROLE_UPDATED',
  ROLE_PERMISSIONS_CHANGED: 'ROLE_PERMISSIONS_CHANGED',

  // Category / Brand
  CATEGORY_CREATED: 'CATEGORY_CREATED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
  CATEGORY_DELETED: 'CATEGORY_DELETED',
  BRAND_CREATED: 'BRAND_CREATED',
  BRAND_UPDATED: 'BRAND_UPDATED',
  BRAND_DELETED: 'BRAND_DELETED',

  // Promotions
  PROMOTION_CREATED: 'PROMOTION_CREATED',
  PROMOTION_UPDATED: 'PROMOTION_UPDATED',
  PROMOTION_DELETED: 'PROMOTION_DELETED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Log an audit event.
 *
 * @example
 * audit({
 *   action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
 *   actor: { id: req.user._id, email: req.user.email },
 *   target: { type: 'user', id: userId, name: userEmail },
 *   details: { oldRoles: ['customer'], newRoles: ['store_manager'] },
 *   requestId: req.requestId,
 *   ip: req.ip,
 * });
 */
const audit = (entry: IAuditEntry): void => {
  logger.info(`[AUDIT] ${entry.action}`, {
    audit: true,
    action: entry.action,
    actor: entry.actor,
    target: entry.target,
    details: entry.details,
    requestId: entry.requestId,
    ip: entry.ip,
  });
};

export default audit;
