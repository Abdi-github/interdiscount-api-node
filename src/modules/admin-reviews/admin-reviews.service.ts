import Review, { IReview } from '../reviews/review.model';
import Product from '../products/product.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class AdminReviewsService {
  /**
   * List all reviews with filters.
   */
  async list(query: {
    page?: string;
    limit?: string;
    is_approved?: string;
    product_id?: string;
    user_id?: string;
    min_rating?: string;
    max_rating?: string;
    sort?: string;
  }): Promise<{ reviews: IReview[]; total: number; page: number; limit: number }> {
    // logger.debug('AdminReviewsService list - loading reviews for moderation');
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.is_approved !== undefined) {
      filter.is_approved = query.is_approved === 'true';
    }
    if (query.product_id) filter.product_id = query.product_id;
    if (query.user_id) filter.user_id = query.user_id;
    if (query.min_rating || query.max_rating) {
      const ratingFilter: Record<string, number> = {};
      if (query.min_rating) ratingFilter.$gte = parseInt(query.min_rating, 10);
      if (query.max_rating) ratingFilter.$lte = parseInt(query.max_rating, 10);
      filter.rating = ratingFilter;
    }

    let sortObj: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'oldest': sortObj = { created_at: 1 }; break;
      case 'rating_high': sortObj = { rating: -1 }; break;
      case 'rating_low': sortObj = { rating: 1 }; break;
      // TODO: Implement review sentiment analysis scoring
      case 'helpful': sortObj = { helpful_count: -1 }; break;
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('product_id', 'name slug images')
        .populate('user_id', 'first_name last_name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return { reviews, total, page, limit };
  }

  /**
   * Get review detail.
   */
  async getById(reviewId: string): Promise<IReview> {
    const review = await Review.findById(reviewId)
      .populate('product_id', 'name slug images')
      .populate('user_id', 'first_name last_name email')
      .lean();

    if (!review) {
      throw ApiError.notFound('Review');
    }

    return review;
  }

  /**
   * Approve or reject a review.
   */
  async approve(reviewId: string, isApproved: boolean): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound('Review');
    }

    review.is_approved = isApproved;
    await review.save();

    // Update product rating stats
    await this.updateProductRatingStats(review.product_id.toString());

    logger.info(`Admin ${isApproved ? 'approved' : 'rejected'} review`, { reviewId });

    return review.toObject();
  }

  /**
   * Delete a review.
   */
  async delete(reviewId: string): Promise<void> {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw ApiError.notFound('Review');
    }

    const productId = review.product_id.toString();
    await Review.findByIdAndDelete(reviewId);

    // Update product rating stats
    await this.updateProductRatingStats(productId);

    logger.info('Admin deleted review', { reviewId });
  }

  /**
   * Recalculate product rating and review_count.
   */
  private async updateProductRatingStats(productId: string): Promise<void> {
    const stats = await Review.aggregate([
      { $match: { product_id: { $toObjectId: productId }, is_approved: true } },
      {
        $group: {
          _id: null,
          avg_rating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const rating = stats[0]?.avg_rating || 0;
    const reviewCount = stats[0]?.count || 0;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(rating * 10) / 10,
      review_count: reviewCount,
    });
  }
}

export default new AdminReviewsService();
