import mongoose from 'mongoose';
import User from '../users/user.model';
import Order from '../orders/order.model';
import OrderItem from '../orders/order-item.model';
import Product from '../products/product.model';
import Store from '../stores/store.model';
import Review from '../reviews/review.model';
import StoreInventory from '../store-management/inventory/store-inventory.model';
import logger from '../../shared/logger';
import {
  type IDateRange,
  type AnalyticsPeriod,
  type IPlatformDashboardResponse,
  type IPlatformDashboardOverview,
  type IOrderStatusBreakdown,
  type IOrderTypeBreakdown,
  type IPaymentMethodBreakdown,
  type IPaymentStatusBreakdown,
  type IRevenueTimeSeriesPoint,
  type ITopProductResponse,
  type ITopStoreResponse,
  type IUserGrowthPoint,
  type IRecentOrderResponse,
  type IStoreDashboardResponse,
  type IStoreDashboardOverview,
  type IPickupSummary,
  ANALYTICS_CONSTANTS,
} from './analytics.types';
import { ORDER_STATUSES } from '../orders/order.types';

/**
 * Analytics Service
 *
 * Centralised analytics with MongoDB aggregation pipelines.
 * Replaces inline aggregations from admin-dashboard and store-dashboard services.
 * All monetary values in CHF.
 */
class AnalyticsService {
  // ===========================  =====================================================
  // Platform Dashboard (Admin)
  // Note: AnalyticsService provides detailed platform-wide reporting
  // TODO: Implement real-time analytics with WebSocket updates
  // ==========================================================================

  /**
   * Get full platform dashboard overview for a date range.
   */
  async getPlatformDashboard(dateRange: IDateRange): Promise<IPlatformDashboardResponse> {
    const dateFilter = { created_at: { $gte: dateRange.from, $lte: dateRange.to } };

    const [
      overview,
      orderStatusBreakdown,
      orderTypeBreakdown,
      paymentMethodBreakdown,
      paymentStatusBreakdown,
    ] = await Promise.all([
      this.getPlatformOverview(dateRange),
      this.getOrderStatusBreakdown(dateFilter),
      this.getOrderTypeBreakdown(dateFilter),
      this.getPaymentMethodBreakdown(dateFilter),
      this.getPaymentStatusBreakdown(dateFilter),
    ]);

    return {
      date_range: {
        from: dateRange.from.toISOString().split('T')[0],
        to: dateRange.to.toISOString().split('T')[0],
      },
      overview,
      order_status_breakdown: orderStatusBreakdown,
      order_type_breakdown: orderTypeBreakdown,
      payment_method_breakdown: paymentMethodBreakdown,
      payment_status_breakdown: paymentStatusBreakdown,
    };
  }

  private async getPlatformOverview(dateRange: IDateRange): Promise<IPlatformDashboardOverview> {
    const dateFilter = { created_at: { $gte: dateRange.from, $lte: dateRange.to } };

    const [
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      revenueAgg,
      totalUsers,
      totalCustomers,
      newUsersPeriod,
      totalProducts,
      activeProducts,
      totalStores,
      activeStores,
      totalReviews,
      pendingReviews,
    ] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.countDocuments({ ...dateFilter, status: ORDER_STATUSES.DELIVERED }),
      Order.countDocuments({ ...dateFilter, status: ORDER_STATUSES.CANCELLED }),
      Order.aggregate([
        { $match: { ...dateFilter, payment_status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      User.countDocuments(),
      User.countDocuments({ user_type: 'customer' }),
      User.countDocuments({ ...dateFilter, user_type: 'customer' }),
      Product.countDocuments(),
      Product.countDocuments({ is_active: true, status: 'PUBLISHED' }),
      Store.countDocuments(),
      Store.countDocuments({ is_active: true }),
      Review.countDocuments(dateFilter),
      Review.countDocuments({ ...dateFilter, is_approved: false }),
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const paidCount = revenueAgg[0]?.count || 0;

    return {
      total_orders: totalOrders,
      delivered_orders: deliveredOrders,
      cancelled_orders: cancelledOrders,
      total_revenue: Math.round(revenue * 100) / 100,
      avg_order_value: paidCount > 0 ? Math.round((revenue / paidCount) * 100) / 100 : 0,
      total_users: totalUsers,
      total_customers: totalCustomers,
      new_users_period: newUsersPeriod,
      total_products: totalProducts,
      active_products: activeProducts,
      total_stores: totalStores,
      active_stores: activeStores,
      total_reviews: totalReviews,
      pending_reviews: pendingReviews,
    };
  }

  private async getOrderStatusBreakdown(
    dateFilter: Record<string, unknown>,
  ): Promise<IOrderStatusBreakdown> {
    const result = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const map = new Map(result.map((r) => [r._id, r.count]));

    return {
      PLACED: map.get('PLACED') || 0,
      CONFIRMED: map.get('CONFIRMED') || 0,
      PROCESSING: map.get('PROCESSING') || 0,
      SHIPPED: map.get('SHIPPED') || 0,
      DELIVERED: map.get('DELIVERED') || 0,
      READY_FOR_PICKUP: map.get('READY_FOR_PICKUP') || 0,
      PICKED_UP: map.get('PICKED_UP') || 0,
      CANCELLED: map.get('CANCELLED') || 0,
      RETURNED: map.get('RETURNED') || 0,
      PICKUP_EXPIRED: map.get('PICKUP_EXPIRED') || 0,
    };
  }

  private async getOrderTypeBreakdown(
    dateFilter: Record<string, unknown>,
  ): Promise<IOrderTypeBreakdown> {
    const result = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$is_store_pickup',
          count: { $sum: 1 },
        },
      },
    ]);

    const map = new Map(result.map((r) => [r._id, r.count]));

    return {
      delivery: map.get(false) || 0,
      store_pickup: map.get(true) || 0,
    };
  }

  private async getPaymentMethodBreakdown(
    dateFilter: Record<string, unknown>,
  ): Promise<IPaymentMethodBreakdown> {
    const result = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$payment_method', count: { $sum: 1 } } },
    ]);

    const map = new Map(result.map((r) => [r._id, r.count]));

    return {
      card: map.get('card') || 0,
      twint: map.get('twint') || 0,
      postfinance: map.get('postfinance') || 0,
      invoice: map.get('invoice') || 0,
    };
  }

  private async getPaymentStatusBreakdown(
    dateFilter: Record<string, unknown>,
  ): Promise<IPaymentStatusBreakdown> {
    const result = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$payment_status', count: { $sum: 1 } } },
    ]);

    const map = new Map(result.map((r) => [r._id, r.count]));

    return {
      PENDING: map.get('PENDING') || 0,
      PROCESSING: map.get('PROCESSING') || 0,
      PAID: map.get('PAID') || 0,
      FAILED: map.get('FAILED') || 0,
      REFUNDED: map.get('REFUNDED') || 0,
    };
  }

  // ==========================================================================
  // Revenue Time Series
  // ==========================================================================

  /**
   * Get revenue time series grouped by period.
   */
  async getRevenueTimeSeries(
    dateRange: IDateRange,
    period: AnalyticsPeriod = 'daily',
  ): Promise<IRevenueTimeSeriesPoint[]> {
    const dateFormat = this.getDateFormat(period);

    const result = await Order.aggregate([
      {
        $match: {
          payment_status: 'PAID',
          created_at: { $gte: dateRange.from, $lte: dateRange.to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: { $round: ['$revenue', 2] },
          orders: 1,
          currency: { $literal: 'CHF' },
        },
      },
    ]);

    logger.info('Revenue time series fetched', {
      period,
      from: dateRange.from,
      to: dateRange.to,
      points: result.length,
    });

    return result;
  }

  // ==========================================================================
  // Top Products
  // ==========================================================================

  /**
   * Get top-selling products by total quantity sold.
   */
  async getTopProducts(
    dateRange: IDateRange,
    limit: number = ANALYTICS_CONSTANTS.DEFAULT_TOP_ITEMS_LIMIT,
  ): Promise<ITopProductResponse[]> {
    const effectiveLimit = Math.min(limit, ANALYTICS_CONSTANTS.MAX_TOP_ITEMS_LIMIT);

    // Build list of order IDs in date range with PAID status
    const orderIds = await this.getPaidOrderIds(dateRange);
    if (orderIds.length === 0) return [];

    const result = await OrderItem.aggregate([
      { $match: { order_id: { $in: orderIds } } },
      {
        $group: {
          _id: '$product_id',
          product_name: { $first: '$product_name' },
          product_code: { $first: '$product_code' },
          quantity_sold: { $sum: '$quantity' },
          revenue: { $sum: '$total_price' },
        },
      },
      { $sort: { quantity_sold: -1 } },
      { $limit: effectiveLimit },
      {
        $project: {
          _id: 0,
          product_id: { $toString: '$_id' },
          product_name: 1,
          product_code: 1,
          quantity_sold: 1,
          revenue: { $round: ['$revenue', 2] },
          currency: { $literal: 'CHF' },
        },
      },
    ]);

    return result;
  }

  // ==========================================================================
  // Top Stores
  // ==========================================================================

  /**
   * Get top stores by order count and revenue (pickup orders).
   */
  async getTopStores(
    dateRange: IDateRange,
    limit: number = ANALYTICS_CONSTANTS.DEFAULT_TOP_STORES_LIMIT,
  ): Promise<ITopStoreResponse[]> {
    const effectiveLimit = Math.min(limit, ANALYTICS_CONSTANTS.MAX_TOP_STORES_LIMIT);

    const result = await Order.aggregate([
      {
        $match: {
          is_store_pickup: true,
          store_pickup_id: { $ne: null },
          payment_status: 'PAID',
          created_at: { $gte: dateRange.from, $lte: dateRange.to },
        },
      },
      {
        $group: {
          _id: '$store_pickup_id',
          total_orders: { $sum: 1 },
          total_revenue: { $sum: '$total' },
        },
      },
      { $sort: { total_revenue: -1 } },
      { $limit: effectiveLimit },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          store_id: { $toString: '$_id' },
          name: { $ifNull: ['$store.name', 'Unknown Store'] },
          slug: { $ifNull: ['$store.slug', ''] },
          total_orders: 1,
          total_revenue: { $round: ['$total_revenue', 2] },
          avg_order_value: {
            $round: [{ $divide: ['$total_revenue', '$total_orders'] }, 2],
          },
          currency: { $literal: 'CHF' },
        },
      },
    ]);

    return result;
  }

  // ==========================================================================
  // Top Categories
  // ==========================================================================

  /**
   * Get top categories by product sales.
   */
  async getTopCategories(
    dateRange: IDateRange,
    limit: number = ANALYTICS_CONSTANTS.DEFAULT_TOP_ITEMS_LIMIT,
  ): Promise<Array<{ category_id: string; category_name: string; quantity_sold: number; revenue: number; currency: string }>> {
    const effectiveLimit = Math.min(limit, ANALYTICS_CONSTANTS.MAX_TOP_ITEMS_LIMIT);

    const orderIds = await this.getPaidOrderIds(dateRange);
    if (orderIds.length === 0) return [];

    const result = await OrderItem.aggregate([
      { $match: { order_id: { $in: orderIds } } },
      // Lookup product to get category_id
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product.category_id',
          quantity_sold: { $sum: '$quantity' },
          revenue: { $sum: '$total_price' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: effectiveLimit },
      // Lookup category name
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          category_id: { $toString: '$_id' },
          category_name: {
            $ifNull: [
              { $ifNull: ['$category.name.de', '$category.name.en'] },
              'Unknown Category',
            ],
          },
          quantity_sold: 1,
          revenue: { $round: ['$revenue', 2] },
          currency: { $literal: 'CHF' },
        },
      },
    ]);

    return result;
  }

  // ==========================================================================
  // User Growth
  // ==========================================================================

  /**
   * Get user registration growth over time.
   */
  async getUserGrowth(
    dateRange: IDateRange,
    period: AnalyticsPeriod = 'daily',
  ): Promise<IUserGrowthPoint[]> {
    const dateFormat = this.getDateFormat(period);

    // New registrations per period
    const growthData = await User.aggregate([
      {
        $match: {
          created_at: { $gte: dateRange.from, $lte: dateRange.to },
          user_type: 'customer',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
          new_users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate cumulative count
    // Start with total users before the date range
    const priorCount = await User.countDocuments({
      user_type: 'customer',
      created_at: { $lt: dateRange.from },
    });

    let cumulative = priorCount;
    const result: IUserGrowthPoint[] = growthData.map((point) => {
      cumulative += point.new_users;
      return {
        date: point._id,
        new_users: point.new_users,
        cumulative,
      };
    });

    return result;
  }

  // ==========================================================================
  // Recent Orders (Admin)
  // ==========================================================================

  /**
   * Get recent orders summary.
   */
  async getRecentOrders(
    limit: number = ANALYTICS_CONSTANTS.DEFAULT_RECENT_ORDERS_LIMIT,
  ): Promise<IRecentOrderResponse[]> {
    const effectiveLimit = Math.min(limit, ANALYTICS_CONSTANTS.MAX_RECENT_ORDERS_LIMIT);

    const orders = await Order.find()
      .sort({ created_at: -1 })
      .limit(effectiveLimit)
      .populate('user_id', 'first_name last_name email')
      .lean();

    return orders.map((order) => ({
      _id: (order._id as mongoose.Types.ObjectId).toString(),
      order_number: order.order_number,
      customer: order.user_id
        ? {
            _id: (order.user_id as unknown as Record<string, unknown>)._id
              ? ((order.user_id as unknown as Record<string, unknown>)._id as mongoose.Types.ObjectId).toString()
              : '',
            first_name: (order.user_id as unknown as Record<string, string>).first_name || '',
            last_name: (order.user_id as unknown as Record<string, string>).last_name || '',
            email: (order.user_id as unknown as Record<string, string>).email || '',
          }
        : null,
      status: order.status,
      payment_status: order.payment_status,
      total: order.total,
      currency: order.currency,
      is_store_pickup: order.is_store_pickup,
      created_at: order.created_at,
    }));
  }

  // ==========================================================================
  // Store Dashboard (Store Manager)
  // ==========================================================================

  /**
   * Get store-scoped analytics dashboard.
   */
  async getStoreDashboard(
    storeId: string,
    dateRange: IDateRange,
  ): Promise<IStoreDashboardResponse> {
    const storeObjectId = new mongoose.Types.ObjectId(storeId);

    const [overview, orderStatusBreakdown, paymentMethodBreakdown, pickupSummary] =
      await Promise.all([
        this.getStoreOverview(storeObjectId, dateRange),
        this.getStoreOrderStatusBreakdown(storeObjectId, dateRange),
        this.getStorePaymentMethodBreakdown(storeObjectId, dateRange),
        this.getPickupSummary(storeObjectId),
      ]);

    return {
      store_id: storeId,
      date_range: {
        from: dateRange.from.toISOString().split('T')[0],
        to: dateRange.to.toISOString().split('T')[0],
      },
      overview,
      order_status_breakdown: orderStatusBreakdown,
      payment_method_breakdown: paymentMethodBreakdown,
      pickup_summary: pickupSummary,
    };
  }

  private async getStoreOverview(
    storeId: mongoose.Types.ObjectId,
    dateRange: IDateRange,
  ): Promise<IStoreDashboardOverview> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const storeFilter = { store_pickup_id: storeId, is_store_pickup: true };
    const dateFilter = { ...storeFilter, created_at: { $gte: dateRange.from, $lte: dateRange.to } };

    const [
      todayOrders,
      todayRevenueAgg,
      totalOrders,
      totalRevenueAgg,
      pendingPickups,
      readyPickups,
      lowStockCount,
      outOfStockCount,
      totalTrackedProducts,
    ] = await Promise.all([
      Order.countDocuments({ ...storeFilter, created_at: { $gte: todayStart } }),
      Order.aggregate([
        { $match: { ...storeFilter, created_at: { $gte: todayStart }, payment_status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments(dateFilter),
      Order.aggregate([
        { $match: { ...dateFilter, payment_status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({
        ...storeFilter,
        status: { $in: [ORDER_STATUSES.PLACED, ORDER_STATUSES.CONFIRMED] },
      }),
      Order.countDocuments({
        ...storeFilter,
        status: ORDER_STATUSES.READY_FOR_PICKUP,
      }),
      StoreInventory.countDocuments({
        store_id: storeId,
        is_active: true,
        quantity: { $gt: 0 },
        $expr: { $lte: ['$quantity', '$min_stock'] },
      }),
      StoreInventory.countDocuments({
        store_id: storeId,
        is_active: true,
        quantity: 0,
      }),
      StoreInventory.countDocuments({
        store_id: storeId,
        is_active: true,
      }),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const paidCount = totalRevenueAgg[0]?.count || 0;

    return {
      today_orders: todayOrders,
      today_revenue: Math.round((todayRevenueAgg[0]?.total || 0) * 100) / 100,
      total_orders: totalOrders,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      avg_order_value: paidCount > 0 ? Math.round((totalRevenue / paidCount) * 100) / 100 : 0,
      pending_pickups: pendingPickups,
      ready_pickups: readyPickups,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      total_tracked_products: totalTrackedProducts,
      currency: 'CHF',
    };
  }

  private async getStoreOrderStatusBreakdown(
    storeId: mongoose.Types.ObjectId,
    dateRange: IDateRange,
  ): Promise<IOrderStatusBreakdown> {
    const result = await Order.aggregate([
      {
        $match: {
          store_pickup_id: storeId,
          is_store_pickup: true,
          created_at: { $gte: dateRange.from, $lte: dateRange.to },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const map = new Map(result.map((r) => [r._id, r.count]));

    return {
      PLACED: map.get('PLACED') || 0,
      CONFIRMED: map.get('CONFIRMED') || 0,
      PROCESSING: map.get('PROCESSING') || 0,
      SHIPPED: map.get('SHIPPED') || 0,
      DELIVERED: map.get('DELIVERED') || 0,
      READY_FOR_PICKUP: map.get('READY_FOR_PICKUP') || 0,
      PICKED_UP: map.get('PICKED_UP') || 0,
      CANCELLED: map.get('CANCELLED') || 0,
      RETURNED: map.get('RETURNED') || 0,
      PICKUP_EXPIRED: map.get('PICKUP_EXPIRED') || 0,
    };
  }

  private async getStorePaymentMethodBreakdown(
    storeId: mongoose.Types.ObjectId,
    dateRange: IDateRange,
  ): Promise<IPaymentMethodBreakdown> {
    const result = await Order.aggregate([
      {
        $match: {
          store_pickup_id: storeId,
          is_store_pickup: true,
          created_at: { $gte: dateRange.from, $lte: dateRange.to },
        },
      },
      { $group: { _id: '$payment_method', count: { $sum: 1 } } },
    ]);

    const map = new Map(result.map((r) => [r._id, r.count]));

    return {
      card: map.get('card') || 0,
      twint: map.get('twint') || 0,
      postfinance: map.get('postfinance') || 0,
      invoice: map.get('invoice') || 0,
    };
  }

  private async getPickupSummary(storeId: mongoose.Types.ObjectId): Promise<IPickupSummary> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Overdue: READY_FOR_PICKUP older than 7 days (~5 business days)
    const overdueCutoff = new Date();
    overdueCutoff.setDate(overdueCutoff.getDate() - 7);

    const storeFilter = { store_pickup_id: storeId, is_store_pickup: true };

    const [pending, confirmed, processing, ready, overdue, completedToday, expired] =
      await Promise.all([
        Order.countDocuments({ ...storeFilter, status: ORDER_STATUSES.PLACED }),
        Order.countDocuments({ ...storeFilter, status: ORDER_STATUSES.CONFIRMED }),
        Order.countDocuments({ ...storeFilter, status: ORDER_STATUSES.PROCESSING }),
        Order.countDocuments({ ...storeFilter, status: ORDER_STATUSES.READY_FOR_PICKUP }),
        Order.countDocuments({
          ...storeFilter,
          status: ORDER_STATUSES.READY_FOR_PICKUP,
          updated_at: { $lt: overdueCutoff },
        }),
        Order.countDocuments({
          ...storeFilter,
          status: ORDER_STATUSES.PICKED_UP,
          updated_at: { $gte: todayStart },
        }),
        Order.countDocuments({
          ...storeFilter,
          status: 'PICKUP_EXPIRED',
        }),
      ]);

    return {
      pending,
      confirmed,
      processing,
      ready,
      overdue,
      completed_today: completedToday,
      expired,
    };
  }

  // ==========================================================================
  // Store Revenue Time Series
  // ==========================================================================

  /**
   * Get revenue time series for a specific store.
   */
  async getStoreRevenueTimeSeries(
    storeId: string,
    dateRange: IDateRange,
    period: AnalyticsPeriod = 'daily',
  ): Promise<IRevenueTimeSeriesPoint[]> {
    const dateFormat = this.getDateFormat(period);

    const result = await Order.aggregate([
      {
        $match: {
          store_pickup_id: new mongoose.Types.ObjectId(storeId),
          is_store_pickup: true,
          payment_status: 'PAID',
          created_at: { $gte: dateRange.from, $lte: dateRange.to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: { $round: ['$revenue', 2] },
          orders: 1,
          currency: { $literal: 'CHF' },
        },
      },
    ]);

    return result;
  }

  /**
   * Get top-selling products at a specific store.
   */
  async getStoreTopProducts(
    storeId: string,
    dateRange: IDateRange,
    limit: number = ANALYTICS_CONSTANTS.DEFAULT_TOP_ITEMS_LIMIT,
  ): Promise<ITopProductResponse[]> {
    const effectiveLimit = Math.min(limit, ANALYTICS_CONSTANTS.MAX_TOP_ITEMS_LIMIT);

    const storeOrders = await Order.find({
      store_pickup_id: new mongoose.Types.ObjectId(storeId),
      is_store_pickup: true,
      payment_status: 'PAID',
      created_at: { $gte: dateRange.from, $lte: dateRange.to },
    })
      .select('_id')
      .lean();

    const orderIds = storeOrders.map((o) => o._id);
    if (orderIds.length === 0) return [];

    const result = await OrderItem.aggregate([
      { $match: { order_id: { $in: orderIds } } },
      {
        $group: {
          _id: '$product_id',
          product_name: { $first: '$product_name' },
          product_code: { $first: '$product_code' },
          quantity_sold: { $sum: '$quantity' },
          revenue: { $sum: '$total_price' },
        },
      },
      { $sort: { quantity_sold: -1 } },
      { $limit: effectiveLimit },
      {
        $project: {
          _id: 0,
          product_id: { $toString: '$_id' },
          product_name: 1,
          product_code: 1,
          quantity_sold: 1,
          revenue: { $round: ['$revenue', 2] },
          currency: { $literal: 'CHF' },
        },
      },
    ]);

    return result;
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Get MongoDB date format string for aggregation grouping.
   */
  private getDateFormat(period: AnalyticsPeriod): string {
    switch (period) {
      case 'weekly':
        return '%Y-W%V';
      case 'monthly':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }

  /**
   * Get order IDs for paid orders within a date range.
   */
  private async getPaidOrderIds(dateRange: IDateRange): Promise<mongoose.Types.ObjectId[]> {
    const orders = await Order.find({
      payment_status: 'PAID',
      created_at: { $gte: dateRange.from, $lte: dateRange.to },
    })
      .select('_id')
      .lean();

    return orders.map((o) => o._id as mongoose.Types.ObjectId);
  }
}

export default new AnalyticsService();
