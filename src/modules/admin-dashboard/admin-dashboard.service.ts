import User from '../users/user.model';
import Order from '../orders/order.model';
import Product from '../products/product.model';
import Store from '../stores/store.model';
import Review from '../reviews/review.model';
import logger from '../../shared/logger';

interface IDashboardStats {
  total_users: number;
  total_customers: number;
  total_staff: number;
  total_orders: number;
  total_revenue: number;
  total_products: number;
  active_products: number;
  total_stores: number;
  total_reviews: number;
  pending_reviews: number;
}

interface IRevenueData {
  period: string;
  revenue: number;
  order_count: number;
}

class AdminDashboardService {
  /**
   * Get platform overview stats.
   */
  async getStats(): Promise<IDashboardStats> {
    /* logger.debug('AdminDashboardService getStats - compiling platform statistics'); */
    const [
      totalUsers,
      totalCustomers,
      totalStaff,
      totalOrders,
      revenueResult,
      totalProducts,
      activeProducts,
      totalStores,
      totalReviews,
      pendingReviews,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ user_type: 'customer' }),
      User.countDocuments({ user_type: { $ne: 'customer' } }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { payment_status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Product.countDocuments(),
      Product.countDocuments({ is_active: true, status: 'PUBLISHED' }),
      Store.countDocuments({ is_active: true }),
      Review.countDocuments(),
      Review.countDocuments({ is_approved: false }),
    ]);

    return {
      total_users: totalUsers,
      total_customers: totalCustomers,
      total_staff: totalStaff,
      total_orders: totalOrders,
      total_revenue: revenueResult[0]?.total || 0,
      total_products: totalProducts,
      active_products: activeProducts,
      total_stores: totalStores,
      total_reviews: totalReviews,
      pending_reviews: pendingReviews,
    };
  }

  /**
   * Get revenue analytics (daily/weekly/monthly).
   */
  async getRevenue(query: {
    period?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<IRevenueData[]> {
    const period = query.period || 'daily';
    const endDate = query.end_date ? new Date(query.end_date) : new Date();
    const startDate = query.start_date
      ? new Date(query.start_date)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    let dateFormat: string;
    switch (period) {
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const revenue = await Order.aggregate([
      {
        $match: {
          payment_status: 'PAID',
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
          revenue: { $sum: '$total' },
          order_count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          revenue: 1,
          order_count: 1,
        },
      },
    ]);

    logger.info('Admin dashboard revenue fetched', { period, startDate, endDate });

    return revenue;
  }

  /**
   * Get recent orders summary.
   */
  async getRecentOrders(query: { limit?: string }): Promise<unknown[]> {
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '10', 10)));

    const orders = await Order.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('user_id', 'first_name last_name email')
      .lean();

    return orders.map((order) => ({
      _id: order._id,
      order_number: order.order_number,
      customer: order.user_id,
      status: order.status,
      payment_status: order.payment_status,
      total: order.total,
      currency: order.currency,
      is_store_pickup: order.is_store_pickup,
      created_at: order.created_at,
    }));
  }
}

export default new AdminDashboardService();
