import Coupon, { ICoupon } from './coupon.model';
import ApiError from '../../shared/errors/ApiError';

interface ICouponValidationResult {
  valid: boolean;
  coupon: {
    code: string;
    description: Record<string, string>;
    discount_type: string;
    discount_value: number;
    minimum_order: number;
  };
  discount_amount?: number;
  message?: string;
}

class CouponService {
  /**
   * Validate a coupon code.
   */
  async validate(
    code: string,
    orderTotal?: number,
    _language?: string,
  ): Promise<ICouponValidationResult> {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();

    if (!coupon) {
      throw ApiError.notFound('Coupon');
    }

    const now = new Date();

    // Check active status
    if (!coupon.is_active) {
      // TODO: Track coupon validation failures for analytics
      return {
        valid: false,
        coupon: this.formatCouponSummary(coupon),
        message: 'This coupon is no longer active',
      };
    }

    // Check date validity
    if (now < coupon.valid_from) {
      return {
        valid: false,
        coupon: this.formatCouponSummary(coupon),
        message: 'This coupon is not yet valid',
      };
    }
    if (now > coupon.valid_until) {
      return {
        valid: false,
        coupon: this.formatCouponSummary(coupon),
        message: 'This coupon has expired',
      };
    }

    // Check usage limit
    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return {
        valid: false,
        coupon: this.formatCouponSummary(coupon),
        message: 'This coupon has reached its maximum usage limit',
      };
    }

    // Check minimum order
    if (orderTotal !== undefined && orderTotal < coupon.minimum_order) {
      return {
        valid: false,
        coupon: this.formatCouponSummary(coupon),
        message: `Minimum order amount of CHF ${coupon.minimum_order.toFixed(2)} required`,
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (orderTotal !== undefined) {
      if (coupon.discount_type === 'percentage') {
        discountAmount = Math.round(orderTotal * (coupon.discount_value / 100) * 100) / 100;
      } else {
        discountAmount = Math.min(coupon.discount_value, orderTotal);
      }
    }

    return {
      valid: true,
      coupon: this.formatCouponSummary(coupon),
      discount_amount: discountAmount,
    };
  }

  /**
   * List available (active + valid) coupons.
   */
  async listAvailable(_language: string): Promise<Record<string, unknown>[]> {
    const now = new Date();

    const coupons = await Coupon.find({
      is_active: true,
      valid_from: { $lte: now },
      valid_until: { $gte: now },
      $expr: {
        $or: [
          { $eq: ['$max_uses', 0] },
          { $lt: ['$used_count', '$max_uses'] },
        ],
      },
    })
      .sort({ discount_value: -1 })
      .lean();

    return coupons.map((c) => ({
      code: c.code,
      description: c.description,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      minimum_order: c.minimum_order,
      valid_until: c.valid_until,
    }));
  }

  /**
   * Format coupon summary for response.
   */
  private formatCouponSummary(coupon: ICoupon): {
    code: string;
    description: Record<string, string>;
    discount_type: string;
    discount_value: number;
    minimum_order: number;
  } {
    return {
      code: coupon.code,
      description: coupon.description as unknown as Record<string, string>,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order: coupon.minimum_order,
    };
  }
}

export default new CouponService();
