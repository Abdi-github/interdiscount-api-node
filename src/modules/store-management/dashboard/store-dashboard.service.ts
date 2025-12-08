import Order from '../../orders/order.model';
import OrderItem from '../../orders/order-item.model';
import StoreInventory from '../inventory/store-inventory.model';
import { IStoreDashboardStats, IRevenueData, ITopProduct, IPickupSummary } from './store-dashboard.types';
import { ORDER_STATUSES } from '../../orders/order.types';

/**
 * Store Dashboard Service — analytics and overview for store managers.
 */
class StoreDashboardService {
  /**
   * Get dashboard overview stats for a store.
   */
  async getStats(storeId: string): Promise<IStoreDashboardStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenueAgg,
      pendingPickups,
      readyPickups,
      lowStockCount,
      outOfStockCount,
      totalProducts,
    ] = await Promise.all([
      // Today's order count
      Order.countDocuments({
        store_pickup_id: storeId,
        is_store_pickup: true,
        created_at: { $gte: todayStart },
      }),

      // Today's revenue
      Order.aggregate([
        {
          $match: {
            store_pickup_id: storeId,
            is_store_pickup: true,
            created_at: { $gte: todayStart },
            payment_status: 'PAID',
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Pending pickup count
      Order.countDocuments({
        store_pickup_id: storeId,
        is_store_pickup: true,
        status: { $in: [ORDER_STATUSES.PLACED, ORDER_STATUSES.CONFIRMED] },
      }),

      // Ready for pickup count
      Order.countDocuments({
        store_pickup_id: storeId,
        is_store_pickup: true,
        status: ORDER_STATUSES.READY_FOR_PICKUP,
      }),

      // Low stock items
      StoreInventory.countDocuments({
        store_id: storeId,
        is_active: true,
        quantity: { $gt: 0 },
        $expr: { $lte: ['$quantity', '$min_stock'] },
      }),

      // Out of stock items
      StoreInventory.countDocuments({
        store_id: storeId,
        is_active: true,
        quantity: 0,
      }),

      // Total tracked products
      StoreInventory.countDocuments({
        store_id: storeId,
        is_active: true,
      }),
    ]);

    return {
      today_orders: todayOrders,
      today_revenue: todayRevenueAgg[0]?.total || 0,
      pending_pickups: pendingPickups,
      ready_pickups: readyPickups,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      total_products: totalProducts,
      currency: 'CHF',
    };
  }

  /**
   * Get revenue breakdown (daily/weekly/monthly).
   */
  async getRevenue(
    storeId: string,
    period: string = 'daily',
    days: number = 30,
  ): Promise<IRevenueData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let dateFormat: string;
    switch (period) {
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const revenue = await Order.aggregate([
      {
        $match: {
          store_pickup_id: storeId,
          is_store_pickup: true,
          payment_status: 'PAID',
          created_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
          total: { $sum: '$total' },
          order_count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return revenue.map((r) => ({
      period: r._id,
      total: Math.round(r.total * 100) / 100,
      order_count: r.order_count,
      currency: 'CHF',
    }));
  }

  /**
   * Get top selling products at this store.
   */
  async getTopProducts(storeId: string, limitCount: number = 10, days: number = 30): Promise<ITopProduct[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get orders for this store in the time period
    const storeOrders = await Order.find({
      store_pickup_id: storeId,
      is_store_pickup: true,
      payment_status: 'PAID',
      created_at: { $gte: startDate },
    })
      .select('_id')
      .lean();

    const orderIds = storeOrders.map((o) => o._id);

    if (orderIds.length === 0) {
      return [];
    }

    const topProducts = await OrderItem.aggregate([
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
      { $limit: limitCount },
    ]);

    return topProducts.map((p) => ({
      product_id: p._id.toString(),
      product_name: p.product_name,
      product_code: p.product_code,
      quantity_sold: p.quantity_sold,
      revenue: Math.round(p.revenue * 100) / 100,
      currency: 'CHF',
    }));
  }

  /**
   * Get click & collect pickup summary.
   */
  async getPickupSummary(storeId: string): Promise<IPickupSummary> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Overdue: READY_FOR_PICKUP older than 5 business days
    const overdueCutoff = new Date();
    overdueCutoff.setDate(overdueCutoff.getDate() - 7); // ~5 business days

    const [pending, confirmed, ready, overdue, completedToday] = await Promise.all([
      Order.countDocuments({
        store_pickup_id: storeId,
        is_store_pickup: true,
        status: ORDER_STATUSES.PLACED,
      }),
      Order.countDocuments({
        store_pickup_id: storeId,
        is_store_pickup: true,
        status: { $in: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PROCESSING] },
      }),
      Order.countDocuments({
        store_pickup_id: storeId,
        is_store_pickup: true,
        status: ORDER_STATUSES.READY_FOR_PICKUP,
      }),
      Order.countDocuments({
        store_pickup_id: storeId,
        is_store_pickup: true,
        status: ORDER_STATUSES.READY_FOR_PICKUP,
        updated_at: { $lt: overdueCutoff },
      }),
      Order.countDocuments({
        store_pickup_id: storeId,
        is_store_pickup: true,
        status: ORDER_STATUSES.PICKED_UP,
        updated_at: { $gte: todayStart },
      }),
    ]);

    return {
      pending,
      confirmed,
      ready,
      overdue,
      completed_today: completedToday,
    };
  }
}

export default new StoreDashboardService();
