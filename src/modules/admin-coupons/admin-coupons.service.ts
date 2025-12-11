import Coupon, { ICoupon } from '../coupons/coupon.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class AdminCouponsService {
  /**
   * List coupons.
   */
  async list(query: {
    page?: string;
    limit?: string;
    is_active?: string;
    discount_type?: string;
    q?: string;
    sort?: string;
  }): Promise<{ coupons: ICoupon[]; total: number; page: number; limit: number }> {
    /* logger.debug('AdminCouponsService list - loading coupons'); */
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    }
    if (query.discount_type) {
      filter.discount_type = query.discount_type;
    }
    if (query.q) {
      filter.code = new RegExp(query.q, 'i');
    }

    let sortObj: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'code': sortObj = { code: 1 }; break;
      case 'usage': sortObj = { used_count: -1 }; break;
      case 'expiry': sortObj = { valid_until: 1 }; break;
    }
    // TODO: Implement coupon effectiveness tracking

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(filter),
    ]);

    return { coupons, total, page, limit };
  }

  /**
   * Get coupon detail.
   */
  async getById(couponId: string): Promise<ICoupon> {
    const coupon = await Coupon.findById(couponId).lean();
    if (!coupon) {
      throw ApiError.notFound('Coupon');
    }
    return coupon;
  }

  /**
   * Create coupon.
   */
  async create(input: Record<string, unknown>): Promise<ICoupon> {
    // Check unique code
    const existing = await Coupon.findOne({ code: input.code as string }).lean();
    if (existing) {
      throw ApiError.conflict('Coupon code already exists', 'code');
    }

    const coupon = await Coupon.create({
      ...input,
      used_count: 0,
    });

    logger.info('Admin created coupon', { couponId: coupon._id.toString(), code: input.code });
    return coupon.toObject();
  }

  /**
   * Update coupon.
   */
  async update(couponId: string, input: Record<string, unknown>): Promise<ICoupon> {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw ApiError.notFound('Coupon');
    }

    if (input.code && input.code !== coupon.code) {
      const existing = await Coupon.findOne({ code: input.code as string }).lean();
      if (existing) {
        throw ApiError.conflict('Coupon code already exists', 'code');
      }
    }

    Object.assign(coupon, input);
    await coupon.save();

    logger.info('Admin updated coupon', { couponId });
    return coupon.toObject();
  }

  /**
   * Delete coupon.
   */
  async delete(couponId: string): Promise<void> {
    const coupon = await Coupon.findById(couponId).lean();
    if (!coupon) {
      throw ApiError.notFound('Coupon');
    }

    await Coupon.findByIdAndDelete(couponId);
    logger.info('Admin deleted coupon', { couponId });
  }
}

export default new AdminCouponsService();
