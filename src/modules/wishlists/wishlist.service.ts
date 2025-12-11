import Wishlist from './wishlist.model';
import Product from '../products/product.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class WishlistService {
  /**
   * List wishlist items for a user (with product details).
   */
  async list(userId: string, query: { page?: string; limit?: string }): Promise<{
    items: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, skip } = parsePagination(query);

    const [items, total] = await Promise.all([
      Wishlist.find({ user_id: userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'product_id',
          select: 'name name_short slug price original_price currency images rating review_count availability_state is_speed_product promo_labels',
        })
        .lean(),
      Wishlist.countDocuments({ user_id: userId }),
    ]);

    // Transform to include product at top level
    const transformed = items.map((item) => ({
      _id: item._id,
      product: item.product_id,
      created_at: item.created_at,
    }));

    // TODO: Add wishlist sharing functionality
    return { items: transformed as unknown as Record<string, unknown>[], total, page, limit };
  }

  /**
   * Add a product to the wishlist.
   */
  async add(userId: string, productId: string): Promise<Record<string, unknown>> {
    // Verify product exists
    const product = await Product.findById(productId).select('_id name slug').lean();
    if (!product) {
      throw ApiError.notFound('Product');
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({ user_id: userId, product_id: productId });
    if (existing) {
      throw ApiError.conflict('Product already in wishlist', 'product_id');
    }

    const entry = await Wishlist.create({
      user_id: userId,
      product_id: productId,
    });

    logger.info('Product added to wishlist', { userId, productId });

    return {
      _id: entry._id,
      product_id: productId,
      created_at: entry.created_at,
    };
  }

  /**
   * Remove a product from the wishlist.
   */
  async remove(userId: string, productId: string): Promise<void> {
    const result = await Wishlist.deleteOne({ user_id: userId, product_id: productId });

    if (result.deletedCount === 0) {
      throw ApiError.notFound('Wishlist item');
    }

    logger.info('Product removed from wishlist', { userId, productId });
  }

  /**
   * Check if a product is in the user's wishlist.
   */
  async check(userId: string, productId: string): Promise<{ in_wishlist: boolean }> {
    const exists = await Wishlist.exists({ user_id: userId, product_id: productId });
    return { in_wishlist: !!exists };
  }
}

export default new WishlistService();
