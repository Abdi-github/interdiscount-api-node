import StorePromotion from './store-promotion.model';
import ApiError from '../../../shared/errors/ApiError';
import { parsePagination } from '../../../shared/utils/formatters';
import logger from '../../../shared/logger';
import { IStorePromotion } from './store-promotion.types';


/**
 * Store Promotion Service — manages store-specific promotions.
 */
class StorePromotionService {
  /**
   * List promotions for a store.
   */
  async list(
    storeId: string,
    query: {
      page?: string;
      limit?: string;
      is_active?: string;
      discount_type?: string;
      current?: string;
    },
  ): Promise<{ promotions: IStorePromotion[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });

    const filter: Record<string, unknown> = { store_id: storeId };

    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    }

    if (query.discount_type) {
      filter.discount_type = query.discount_type;
    }

    // Only currently active promotions (within date range)
    if (query.current === 'true') {
      const now = new Date();
      filter.valid_from = { $lte: now };
      filter.valid_until = { $gte: now };
      filter.is_active = true;
    }

    const [promotions, total] = await Promise.all([
      StorePromotion.find(filter)
        .populate('product_id', 'name name_short slug code price images')
        .populate('category_id', 'name slug')
        .populate('created_by', 'first_name last_name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StorePromotion.countDocuments(filter),
    ]);

    return { promotions: promotions as unknown as IStorePromotion[], total, page, limit };
  }

  /**
   * Create a store promotion.
   */
  async create(
    storeId: string,
    userId: string,
    data: {
      product_id?: string | null;
      category_id?: string | null;
      title: string;
      description?: string;
      discount_type: string;
      discount_value: number;
      buy_quantity?: number | null;
      get_quantity?: number | null;
      valid_from: string;
      valid_until: string;
      is_active?: boolean;
    },
  ): Promise<IStorePromotion> {
    const validFrom = new Date(data.valid_from);
    const validUntil = new Date(data.valid_until);

    if (validUntil <= validFrom) {
      throw ApiError.badRequest('valid_until must be after valid_from');
    }

    const promotion = await StorePromotion.create({
      store_id: storeId,
      product_id: data.product_id || null,
      category_id: data.category_id || null,
      title: data.title,
      description: data.description || '',
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      buy_quantity: data.buy_quantity || null,
      get_quantity: data.get_quantity || null,
      valid_from: validFrom,
      valid_until: validUntil,
      is_active: data.is_active !== false,
      created_by: userId,
    });

    const populated = await StorePromotion.findById(promotion._id)
      .populate('product_id', 'name name_short slug code price images')
      .populate('category_id', 'name slug')
      .populate('created_by', 'first_name last_name')
      .lean();

    logger.info(`Store promotion created: "${data.title}" at store ${storeId}`);

    return populated as unknown as IStorePromotion;
  }

  /**
   * Get promotion by ID — scoped to store.
   */
  async getById(storeId: string, promotionId: string): Promise<IStorePromotion> {
    const promotion = await StorePromotion.findOne({
      _id: promotionId,
      store_id: storeId,
    })
      .populate('product_id', 'name name_short slug code price images')
      .populate('category_id', 'name slug')
      .populate('created_by', 'first_name last_name')
      .lean();

    if (!promotion) {
      throw ApiError.notFound('Promotion not found at your store');
    }

    return promotion as unknown as IStorePromotion;
  }

  /**
   * Update promotion.
   */
  async update(
    storeId: string,
    promotionId: string,
    data: Record<string, unknown>,
  ): Promise<IStorePromotion> {
    // Parse dates if provided
    if (data.valid_from && typeof data.valid_from === 'string') {
      data.valid_from = new Date(data.valid_from);
    }
    if (data.valid_until && typeof data.valid_until === 'string') {
      data.valid_until = new Date(data.valid_until);
    }

    const promotion = await StorePromotion.findOneAndUpdate(
      { _id: promotionId, store_id: storeId },
      { $set: data },
      { new: true },
    )
      .populate('product_id', 'name name_short slug code price images')
      .populate('category_id', 'name slug')
      .populate('created_by', 'first_name last_name')
      .lean();

    if (!promotion) {
      throw ApiError.notFound('Promotion not found at your store');
    }

    logger.info(`Store promotion updated: ${promotionId} at store ${storeId}`);

    return promotion as unknown as IStorePromotion;
  }

  /**
   * Delete promotion.
   */
  async delete(storeId: string, promotionId: string): Promise<void> {
    const result = await StorePromotion.findOneAndDelete({
      _id: promotionId,
      store_id: storeId,
    });

    if (!result) {
      throw ApiError.notFound('Promotion not found at your store');
    }

    logger.info(`Store promotion deleted: ${promotionId} at store ${storeId}`);
  }
}

export default new StorePromotionService();
