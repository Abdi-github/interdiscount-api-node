import Store, { IStore } from '../stores/store.model';
import User from '../users/user.model';
import StoreInventory from '../store-management/inventory/store-inventory.model';
import Order from '../orders/order.model';
import Canton from '../cantons/canton.model';
import City from '../cities/city.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class AdminStoresService {
  /**
   * List stores with filters.
   */
  async list(query: {
    page?: string;
    limit?: string;
    q?: string;
    canton_id?: string;
    city_id?: string;
    format?: string;
    is_active?: string;
    sort?: string;
  }): Promise<{ stores: unknown[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.canton_id) filter.canton_id = query.canton_id;
    if (query.city_id) filter.city_id = query.city_id;
    if (query.format) filter.format = query.format;
    if (query.is_active !== undefined) filter.is_active = query.is_active === 'true';
    if (query.q) {
      const regex = new RegExp(query.q, 'i');
      filter.$or = [{ name: regex }, { store_id: regex }, { postal_code: regex }];
    }

    let sortObj: Record<string, 1 | -1> = { name: 1 };
    switch (query.sort) {
      case 'newest': sortObj = { created_at: -1 }; break;
      case 'format': sortObj = { format: 1, name: 1 }; break;
    }

    const [stores, total] = await Promise.all([
      Store.find(filter)
        .populate('city_id', 'name slug')
        .populate('canton_id', 'name code')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Store.countDocuments(filter),
    ]);

    // Add inventory summary for each store
    const storesWithStats = await Promise.all(
      stores.map(async (store) => {
        const inventoryCount = await StoreInventory.countDocuments({ store_id: store._id });
        const staffCount = await User.countDocuments({ store_id: store._id });
        return { ...store, inventory_count: inventoryCount, staff_count: staffCount };
      }),
    );

    return { stores: storesWithStats, total, page, limit };
  }

  /**
   * Create store.
   */
  async create(input: Record<string, unknown>): Promise<IStore> {
    // Validate unique slug
    const existingSlug = await Store.findOne({ slug: input.slug as string }).lean();
    if (existingSlug) {
      throw ApiError.conflict('Store slug already exists', 'slug');
    }

    // Validate unique store_id
    const existingStoreId = await Store.findOne({ store_id: input.store_id as string }).lean();
    if (existingStoreId) {
      throw ApiError.conflict('Store ID already exists', 'store_id');
    }

    // Validate canton and city
    const [canton, city] = await Promise.all([
      Canton.findById(input.canton_id).lean(),
      City.findById(input.city_id).lean(),
    ]);
    if (!canton) throw ApiError.badRequest('Canton not found');
    if (!city) throw ApiError.badRequest('City not found');

    const store = await Store.create(input);
    logger.info('Admin created store', { storeId: store._id.toString() });

    return store.toObject();
  }

  /**
   * Get store detail with staff and inventory stats.
   */
  async getById(storeId: string): Promise<unknown> {
    const store = await Store.findById(storeId)
      .populate('city_id', 'name slug')
      .populate('canton_id', 'name code')
      .lean();

    if (!store) {
      throw ApiError.notFound('Store');
    }

    const [inventoryCount, lowStockCount, staffCount, totalOrders] = await Promise.all([
      StoreInventory.countDocuments({ store_id: storeId }),
      StoreInventory.countDocuments({
        store_id: storeId,
        $expr: { $lte: ['$quantity', '$min_stock'] },
      }),
      User.countDocuments({ store_id: storeId }),
      Order.countDocuments({ store_pickup_id: storeId }),
    ]);

    return {
      ...store,
      stats: {
        inventory_count: inventoryCount,
        low_stock_count: lowStockCount,
        staff_count: staffCount,
        total_orders: totalOrders,
      },
    };
  }

  /**
   * Update store.
   */
  async update(storeId: string, input: Record<string, unknown>): Promise<IStore> {
    const store = await Store.findById(storeId);
    if (!store) {
      throw ApiError.notFound('Store');
    }

    if (input.slug && input.slug !== store.slug) {
      const existing = await Store.findOne({ slug: input.slug as string }).lean();
      if (existing) {
        throw ApiError.conflict('Store slug already exists', 'slug');
      }
    }

    Object.assign(store, input);
    await store.save();

    logger.info('Admin updated store', { storeId });
    return store.toObject();
  }

  /**
   * Activate/deactivate store.
   */
  async updateStatus(storeId: string, isActive: boolean): Promise<IStore> {
    const store = await Store.findById(storeId);
    if (!store) {
      throw ApiError.notFound('Store');
    }

    store.is_active = isActive;
    await store.save();

    logger.info(`Admin ${isActive ? 'activated' : 'deactivated'} store`, { storeId });
    return store.toObject();
  }

  /**
   * View store inventory.
   */
  async getInventory(
    storeId: string,
    query: { page?: string; limit?: string },
  ): Promise<{ inventory: unknown[]; total: number; page: number; limit: number }> {
    const store = await Store.findById(storeId).lean();
    if (!store) {
      throw ApiError.notFound('Store');
    }

    const { page, limit, skip } = parsePagination(query);

    const [inventory, total] = await Promise.all([
      StoreInventory.find({ store_id: storeId })
        .populate('product_id', 'name name_short code price images')
        .sort({ updated_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StoreInventory.countDocuments({ store_id: storeId }),
    ]);

    return { inventory, total, page, limit };
  }

  /**
   * List staff assigned to store.
   */
  async getStaff(storeId: string): Promise<unknown[]> {
    const store = await Store.findById(storeId).lean();
    if (!store) {
      throw ApiError.notFound('Store');
    }

    const staff = await User.find({ store_id: storeId })
      .select('-password_hash -verification_token -verification_token_expires -reset_password_token -reset_password_expires')
      .lean();

    return staff;
  }

  /**
   * Assign/remove staff to/from store.
   */
  async updateStaff(storeId: string, userIds: string[]): Promise<unknown[]> {
    const store = await Store.findById(storeId).lean();
    if (!store) {
      throw ApiError.notFound('Store');
    }

    // Remove all current staff from this store
    await User.updateMany({ store_id: storeId }, { $set: { store_id: null } });

    // Assign new staff
    if (userIds.length > 0) {
      await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { store_id: storeId } },
      );
    }

    logger.info('Admin updated store staff', { storeId, staffCount: userIds.length });

    return this.getStaff(storeId);
  }

  /**
   * Store-level analytics.
   */
  async getAnalytics(storeId: string): Promise<unknown> {
    const store = await Store.findById(storeId).lean();
    if (!store) {
      throw ApiError.notFound('Store');
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [orderStats, revenueByDay, inventoryStats] = await Promise.all([
      Order.aggregate([
        { $match: { store_pickup_id: store._id, created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$total' },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            store_pickup_id: store._id,
            payment_status: 'PAID',
            created_at: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      StoreInventory.aggregate([
        { $match: { store_id: store._id } },
        {
          $group: {
            _id: null,
            total_products: { $sum: 1 },
            total_quantity: { $sum: '$quantity' },
            total_reserved: { $sum: '$reserved' },
            low_stock: {
              $sum: { $cond: [{ $lte: ['$quantity', '$min_stock'] }, 1, 0] },
            },
            out_of_stock: {
              $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    return {
      store: { _id: store._id, name: store.name, store_id: store.store_id },
      period: { start: thirtyDaysAgo, end: new Date() },
      orders: orderStats,
      revenue_by_day: revenueByDay,
      inventory: inventoryStats[0] || {
        total_products: 0,
        total_quantity: 0,
        total_reserved: 0,
        low_stock: 0,
        out_of_stock: 0,
      },
    };
  }
}

export default new AdminStoresService();
