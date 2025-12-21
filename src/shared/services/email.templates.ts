import config from '../../config';

/**
 * Email templates for transactional emails.
 * Returns { subject, html, text } for each email type.
 */

const BASE_URL = `http://localhost:${config.port}`;
const API_URL = `${BASE_URL}/api/${config.apiVersion}`;

const wrapHtml = (body: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interdiscount</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #e30613; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; }
    .content h2 { color: #333333; margin-top: 0; }
    .content p { color: #555555; line-height: 1.6; }
    .btn { display: inline-block; padding: 12px 32px; background: #e30613; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 16px 0; }
    .footer { padding: 24px; text-align: center; color: #999999; font-size: 12px; background: #f9f9f9; }
    .order-detail { background: #f9f9f9; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .order-detail p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interdiscount</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Interdiscount Clone. All rights reserved.</p>
      <p>This is a development/test email.</p>
    </div>
  </div>
</body>
</html>`;

// ─── Verification Email ──────────────────────────

export const verificationEmail = (
  firstName: string,
  token: string,
  _language = 'de',
): { subject: string; html: string; text: string } => {
  const verifyUrl = `${API_URL}/public/auth/verify-email/${token}`;

  return {
    subject: 'Verify your email address — Interdiscount',
    html: wrapHtml(`
      <h2>Welcome, ${firstName}!</h2>
      <p>Thank you for registering at Interdiscount. Please verify your email address to activate your account.</p>
      <p style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verify Email</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #777;">${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    `),
    text: `Welcome, ${firstName}!\n\nPlease verify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  };
};

// ─── Password Reset Email ──────────────────────────

export const passwordResetEmail = (
  firstName: string,
  token: string,
  _language = 'de',
): { subject: string; html: string; text: string } => {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  return {
    subject: 'Reset your password — Interdiscount',
    html: wrapHtml(`
      <h2>Password Reset</h2>
      <p>Hello ${firstName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password.</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #777;">${resetUrl}</p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `),
    text: `Hello ${firstName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  };
};

// ─── Order Confirmation Email ──────────────────────────

export const orderConfirmationEmail = (
  firstName: string,
  orderNumber: string,
  total: number,
  currency: string,
  isStorePickup: boolean,
  storeName?: string,
  _language = 'de',
): { subject: string; html: string; text: string } => {
  const formattedTotal = `${currency} ${total.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`;
  const pickupInfo = isStorePickup && storeName
    ? `<p><strong>Pickup Store:</strong> ${storeName}</p><p>We'll notify you when your order is ready for collection.</p>`
    : `<p>We'll send you a notification when your order ships.</p>`;

  return {
    subject: `Order Confirmation ${orderNumber} — Interdiscount`,
    html: wrapHtml(`
      <h2>Order Confirmed!</h2>
      <p>Hello ${firstName},</p>
      <p>Thank you for your order. Here are your order details:</p>
      <div class="order-detail">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Total:</strong> ${formattedTotal}</p>
        <p><strong>Type:</strong> ${isStorePickup ? 'Store Pickup' : 'Home Delivery'}</p>
      </div>
      ${pickupInfo}
    `),
    text: `Hello ${firstName},\n\nOrder ${orderNumber} confirmed. Total: ${formattedTotal}. ${isStorePickup ? `Pickup at: ${storeName}` : 'Home delivery'}.`,
  };
};

// ─── Order Status Update Email ──────────────────────────

export const orderStatusEmail = (
  firstName: string,
  orderNumber: string,
  status: string,
  _language = 'de',
): { subject: string; html: string; text: string } => {
  const statusMessages: Record<string, string> = {
    CONFIRMED: 'Your order has been confirmed and is being processed.',
    PROCESSING: 'Your order is being prepared for shipment.',
    SHIPPED: 'Your order has been shipped! You\'ll receive it soon.',
    DELIVERED: 'Your order has been delivered. Enjoy!',
    CANCELLED: 'Your order has been cancelled.',
    RETURNED: 'Your return has been processed.',
    READY_FOR_PICKUP: 'Your order is ready for pickup!',
    PICKED_UP: 'Your order has been collected. Thank you!',
  };

  const message = statusMessages[status] || `Your order status has been updated to: ${status}`;

  return {
    subject: `Order ${orderNumber} — ${status.replace(/_/g, ' ')} — Interdiscount`,
    html: wrapHtml(`
      <h2>Order Update</h2>
      <p>Hello ${firstName},</p>
      <div class="order-detail">
        <p><strong>Order:</strong> ${orderNumber}</p>
        <p><strong>Status:</strong> ${status.replace(/_/g, ' ')}</p>
      </div>
      <p>${message}</p>
    `),
    text: `Hello ${firstName},\n\nOrder ${orderNumber} status: ${status}. ${message}`,
  };
};

// ─── Pickup Ready Email ──────────────────────────

export const pickupReadyEmail = (
  firstName: string,
  orderNumber: string,
  storeName: string,
  _language = 'de',
): { subject: string; html: string; text: string } => {
  return {
    subject: `Your order ${orderNumber} is ready for pickup! — Interdiscount`,
    html: wrapHtml(`
      <h2>Your Order is Ready! 🎉</h2>
      <p>Hello ${firstName},</p>
      <p>Great news! Your order is ready for collection at our store.</p>
      <div class="order-detail">
        <p><strong>Order:</strong> ${orderNumber}</p>
        <p><strong>Store:</strong> ${storeName}</p>
      </div>
      <p>Please pick up your order within <strong>5 business days</strong>.</p>
      <p>Don't forget to bring a valid photo ID.</p>
    `),
    text: `Hello ${firstName},\n\nOrder ${orderNumber} is ready for pickup at ${storeName}. Please collect within 5 business days. Bring a valid photo ID.`,
  };
};
