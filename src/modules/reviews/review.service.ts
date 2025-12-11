import Review, { IReview } from './review.model';
import Product from '../products/product.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

interface ICreateReviewInput {
  product_id: string;
  rating: number;
  title: string;
  comment: string;
  language?: string;
}

interface IUpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
}

class ReviewService {
  /**
   * Create a product review.
   */
  async create(userId: string, input: ICreateReviewInput, userLanguage: string): Promise<IReview> {
    // Verify product exists
    const product = await Product.findById(input.product_id).select('_id').lean();
    if (!product) {
      throw ApiError.notFound('Product');
    }

    // Check if user already reviewed this product
    const existing = await Review.findOne({
      product_id: input.product_id,
      user_id: userId,
    });
    if (existing) {
      throw ApiError.conflict('You have already reviewed this product', 'product_id');
    }

    const review = await Review.create({
      product_id: input.product_id,
      user_id: userId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      language: input.language || userLanguage,
      is_verified_purchase: false, // Would be set by checking order history
      is_approved: false, // Requires admin approval
    });

    // Update product review_count and rating
    await this.updateProductRatingStats(input.product_id);

    logger.info('Review created', { userId, productId: input.product_id, reviewId: review._id.toString() });

    return review.toObject();
  }

  /**
   * List reviews by the current user.
   */
  async listMyReviews(userId: string, query: { page?: string; limit?: string }): Promise<{
    reviews: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, skip } = parsePagination(query);

    const [reviews, total] = await Promise.all([
      Review.find({ user_id: userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'product_id',
          select: 'name slug images price',
        })
        .lean(),
      Review.countDocuments({ user_id: userId }),
    ]);

    return { reviews: reviews as unknown as Record<string, unknown>[], total, page, limit };
  }

  /**
   * Update a review (only the author can update).
   */
  async update(userId: string, reviewId: string, input: IUpdateReviewInput): Promise<IReview> {
    const review = await Review.findOne({ _id: reviewId, user_id: userId });
    if (!review) {
      throw ApiError.notFound('Review');
    }

    if (input.rating !== undefined) review.rating = input.rating;
    if (input.title !== undefined) review.title = input.title;
    if (input.comment !== undefined) review.comment = input.comment;

    // Re-submit for approval after edit
    review.is_approved = false;

    await review.save();

    // Update product rating stats
    await this.updateProductRatingStats(review.product_id.toString());

    logger.info('Review updated', { userId, reviewId });

    return review.toObject();
  }

  /**
   * Delete a review (only the author can delete).
   */
  async delete(userId: string, reviewId: string): Promise<void> {
    const review = await Review.findOne({ _id: reviewId, user_id: userId });
    if (!review) {
      throw ApiError.notFound('Review');
    }

    const productId = review.product_id.toString();
    await Review.deleteOne({ _id: reviewId });

    // Update product rating stats
    await this.updateProductRatingStats(productId);

    logger.info('Review deleted', { userId, reviewId });
  }

  /**
   * List approved reviews for a product (public endpoint).
   */
  async listProductReviews(
    productId: string,
    query: { page?: string; limit?: string; sort?: string },
  ): Promise<{
    reviews: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
    stats: { average_rating: number; total_reviews: number; distribution: Record<string, number> };
  }> {
    // Verify product exists
    const product = await Product.findById(productId).select('_id').lean();
    if (!product) {
      throw ApiError.notFound('Product');
    }

    const { page, limit, skip } = parsePagination(query);

    const filter = { product_id: productId, is_approved: true };

    // Sort option
    let sortOption: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'oldest':
        sortOption = { created_at: 1 };
        break;
      case 'rating_high':
        sortOption = { rating: -1, created_at: -1 };
        break;
      case 'rating_low':
        sortOption = { rating: 1, created_at: -1 };
        break;
      case 'helpful':
        sortOption = { helpful_count: -1, created_at: -1 };
        break;
      case 'newest':
      default:
        sortOption = { created_at: -1 };
        break;
    }

    const [reviews, total, statsResult] = await Promise.all([
      Review.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'user_id',
          select: 'first_name last_name',
        })
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { product_id: product._id, is_approved: true } },
        {
          $group: {
            _id: null,
            average_rating: { $avg: '$rating' },
            total_reviews: { $sum: 1 },
            rating_1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            rating_2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            rating_3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            rating_4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            rating_5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const rawStats = statsResult[0];
    const stats = {
      average_rating: rawStats ? Math.round(rawStats.average_rating * 10) / 10 : 0,
      total_reviews: rawStats?.total_reviews || 0,
      distribution: {
        '1': rawStats?.rating_1 || 0,
        '2': rawStats?.rating_2 || 0,
        '3': rawStats?.rating_3 || 0,
        '4': rawStats?.rating_4 || 0,
        '5': rawStats?.rating_5 || 0,
      },
    };

    return { reviews: reviews as unknown as Record<string, unknown>[], total, page, limit, stats };
  }

  /**
   * Recalculate and update product rating and review_count.
   */
  private async updateProductRatingStats(productId: string): Promise<void> {
    const result = await Review.aggregate([
      { $match: { product_id: new (await import('mongoose')).Types.ObjectId(productId), is_approved: true } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = result[0];
    await Product.updateOne(
      { _id: productId },
      {
        rating: stats ? Math.round(stats.average * 10) / 10 : 0,
        review_count: stats?.count || 0,
      },
    );
  }
}

export default new ReviewService();
