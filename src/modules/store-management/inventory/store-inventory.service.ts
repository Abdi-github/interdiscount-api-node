import StoreInventory from './store-inventory.model';
import Product from '../../products/product.model';
import ApiError from '../../../shared/errors/ApiError';
import { parsePagination } from '../../../shared/utils/formatters';
import logger from '../../../shared/logger';
import { IBulkUpdateItem } from './store-inventory.types';
import { IStoreInventory } from './store-inventory.types';

/**
 * Store Inventory Service — manages per-store stock levels.
 */
class StoreInventoryService {
  /**
   * List inventory for a store with filtering, sorting, pagination.
   */
  async list(
    storeId: string,
    query: {
      page?: string;
      limit?: string;
      sort?: string;
      low_stock?: string;
      out_of_stock?: string;
      search?: string;
      is_active?: string;
    },
  ): Promise<{ items: IStoreInventory[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });

    const filter: Record<string, unknown> = { store_id: storeId };

    // Filter by active status
    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    } else {
      filter.is_active = true;
    }

    // Low stock filter: quantity <= min_stock AND quantity > 0
    if (query.low_stock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$min_stock'] };
      filter.quantity = { $gt: 0 };
    }

    // Out of stock filter: quantity === 0
    if (query.out_of_stock === 'true') {
      filter.quantity = 0;
    }

    // Sorting
    let sortObj: Record<string, 1 | -1> = { updated_at: -1 };
    switch (query.sort) {
      case 'quantity_asc':
        sortObj = { quantity: 1 };
        break;
      case 'quantity_desc':
        sortObj = { quantity: -1 };
        break;
      case 'product_name':
        sortObj = { 'product.name': 1 };
        break;
      case 'location':
        sortObj = { location_in_store: 1 };
        break;
      case 'updated':
        sortObj = { updated_at: -1 };
        break;
    }

    // If searching by product name, we need to do a lookup with filtering
    if (query.search) {
      const matchingProducts = await Product.find(
        { name: { $regex: query.search, $options: 'i' } },
        '_id',
      ).lean();
      const productIds = matchingProducts.map((p) => p._id);
      filter.product_id = { $in: productIds };
    }

    const [items, total] = await Promise.all([
      StoreInventory.find(filter)
        .populate('product_id', 'name name_short slug code displayed_code price images availability_state')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      StoreInventory.countDocuments(filter),
    ]);

    return { items: items as unknown as IStoreInventory[], total, page, limit };
  }

  /**
   * Get inventory detail for a specific product at a store.
   */
  async getByProductId(storeId: string, productId: string): Promise<IStoreInventory> {
    const inventory = await StoreInventory.findOne({
      store_id: storeId,
      product_id: productId,
    })
      .populate('product_id', 'name name_short slug code displayed_code price images availability_state')
      .lean();

    if (!inventory) {
      throw ApiError.notFound('Inventory record not found for this product at your store');
    }

    return inventory as unknown as IStoreInventory;
  }

  /**
   * Update inventory for a product at a store.
   */
  async update(
    storeId: string,
    productId: string,
    data: {
      quantity?: number;
      reserved?: number;
      min_stock?: number;
      max_stock?: number;
      location_in_store?: string;
      is_display_unit?: boolean;
      is_active?: boolean;
    },
  ): Promise<IStoreInventory> {
    const updateData: Record<string, unknown> = { ...data };

    // Track restock
    if (data.quantity !== undefined) {
      const current = await StoreInventory.findOne({ store_id: storeId, product_id: productId }).lean();
      if (current && data.quantity > current.quantity) {
        updateData.last_restock_at = new Date();
      }
    }

    const inventory = await StoreInventory.findOneAndUpdate(
      { store_id: storeId, product_id: productId },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
      .populate('product_id', 'name name_short slug code displayed_code price images availability_state')
      .lean();

    if (!inventory) {
      throw ApiError.internal('Failed to update inventory');
    }

    logger.info(`Inventory updated: store=${storeId}, product=${productId}`, { data });

    return inventory as unknown as IStoreInventory;
  }

  /**
   * Bulk update stock for multiple products at a store.
   */
  async bulkUpdate(
    storeId: string,
    items: IBulkUpdateItem[],
  ): Promise<{ updated: number; errors: Array<{ product_id: string; error: string }> }> {
    let updated = 0;
    const errors: Array<{ product_id: string; error: string }> = [];

    for (const item of items) {
      try {
        const updateData: Record<string, unknown> = {
          quantity: item.quantity,
          last_restock_at: new Date(),
        };
        if (item.location_in_store) {
          updateData.location_in_store = item.location_in_store;
        }

        await StoreInventory.findOneAndUpdate(
          { store_id: storeId, product_id: item.product_id },
          { $set: updateData },
          { upsert: true, setDefaultsOnInsert: true },
        );
        updated++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ product_id: item.product_id, error: message });
      }
    }

    logger.info(`Bulk inventory update: store=${storeId}, updated=${updated}, errors=${errors.length}`);

    return { updated, errors };
  }

  /**
   * Get low-stock items (quantity > 0 but <= min_stock).
   */
  async getLowStock(
    storeId: string,
    query: { page?: string; limit?: string },
  ): Promise<{ items: IStoreInventory[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });

    const filter: Record<string, unknown> = {
      store_id: storeId,
      is_active: true,
      quantity: { $gt: 0 },
      $expr: { $lte: ['$quantity', '$min_stock'] },
    };

    const [items, total] = await Promise.all([
      StoreInventory.find(filter)
        .populate('product_id', 'name name_short slug code displayed_code price images')
        .sort({ quantity: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StoreInventory.countDocuments(filter),
    ]);

    return { items: items as unknown as IStoreInventory[], total, page, limit };
  }

  /**
   * Get out-of-stock items.
   */
  async getOutOfStock(
    storeId: string,
    query: { page?: string; limit?: string },
  ): Promise<{ items: IStoreInventory[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });

    const filter: Record<string, unknown> = {
      store_id: storeId,
      is_active: true,
      quantity: 0,
    };

    const [items, total] = await Promise.all([
      StoreInventory.find(filter)
        .populate('product_id', 'name name_short slug code displayed_code price images')
        .sort({ updated_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StoreInventory.countDocuments(filter),
    ]);

    return { items: items as unknown as IStoreInventory[], total, page, limit };
  }

  /**
   * Scan-based stock update — find product by code and adjust quantity.
   */
  async scanUpdate(
    storeId: string,
    productCode: string,
    quantityChange: number,
    operation: 'add' | 'subtract' | 'set',
  ): Promise<IStoreInventory> {
    // Find product by code or displayed_code
    const product = await Product.findOne({
      $or: [{ code: productCode }, { displayed_code: productCode }],
    }).lean();

    if (!product) {
      throw ApiError.notFound(`Product not found with code: ${productCode}`);
    }

    let inventory = await StoreInventory.findOne({
      store_id: storeId,
      product_id: product._id,
    });

    if (!inventory) {
      // Create new inventory record
      inventory = new StoreInventory({
        store_id: storeId,
        product_id: product._id,
        quantity: 0,
        reserved: 0,
      });
    }

    switch (operation) {
      case 'add':
        inventory.quantity += quantityChange;
        inventory.last_restock_at = new Date();
        break;
      case 'subtract':
        inventory.quantity = Math.max(0, inventory.quantity - quantityChange);
        inventory.last_sold_at = new Date();
        break;
      case 'set':
        if (quantityChange > inventory.quantity) {
          inventory.last_restock_at = new Date();
        }
        inventory.quantity = Math.max(0, quantityChange);
        break;
    }

    await inventory.save();

    const populated = await StoreInventory.findById(inventory._id)
      .populate('product_id', 'name name_short slug code displayed_code price images')
      .lean();

    return populated as unknown as IStoreInventory;
  }

  /**
   * Export inventory report for a store (returns data for CSV generation).
   */
  async exportInventory(storeId: string): Promise<IStoreInventory[]> {
    const items = await StoreInventory.find({
      store_id: storeId,
      is_active: true,
    })
      .populate('product_id', 'name code displayed_code price availability_state')
      .sort({ location_in_store: 1, quantity: 1 })
      .lean();

    return items as unknown as IStoreInventory[];
  }

  /**
   * Reserve stock for a pickup order.
   */
  async reserveStock(storeId: string, productId: string, quantity: number): Promise<void> {
    const inventory = await StoreInventory.findOne({
      store_id: storeId,
      product_id: productId,
      is_active: true,
    });

    if (!inventory) {
      throw ApiError.badRequest('Product not available at this store');
    }

    const available = inventory.quantity - inventory.reserved;
    if (available < quantity) {
      throw ApiError.badRequest(`Insufficient stock. Available: ${available}, requested: ${quantity}`);
    }

    inventory.reserved += quantity;
    await inventory.save();

    logger.info(`Stock reserved: store=${storeId}, product=${productId}, qty=${quantity}`);
  }

  /**
   * Release reserved stock (on pickup cancellation).
   */
  async releaseReservedStock(storeId: string, productId: string, quantity: number): Promise<void> {
    await StoreInventory.findOneAndUpdate(
      { store_id: storeId, product_id: productId },
      { $inc: { reserved: -quantity } },
    );

    logger.info(`Reserved stock released: store=${storeId}, product=${productId}, qty=${quantity}`);
  }

  /**
   * Collect stock (decrement both quantity and reserved on customer pickup).
   */
  async collectStock(storeId: string, productId: string, quantity: number): Promise<void> {
    await StoreInventory.findOneAndUpdate(
      { store_id: storeId, product_id: productId },
      {
        $inc: { quantity: -quantity, reserved: -quantity },
        $set: { last_sold_at: new Date() },
      },
    );

    logger.info(`Stock collected: store=${storeId}, product=${productId}, qty=${quantity}`);
  }

  /**
   * Check stock availability at a specific store.
   */
  async checkAvailability(
    storeId: string,
    productId: string,
  ): Promise<{ available: boolean; quantity: number; reserved: number; net_available: number }> {
    const inventory = await StoreInventory.findOne({
      store_id: storeId,
      product_id: productId,
      is_active: true,
    }).lean();

    if (!inventory) {
      return { available: false, quantity: 0, reserved: 0, net_available: 0 };
    }

    const netAvailable = Math.max(0, inventory.quantity - inventory.reserved);
    return {
      available: netAvailable > 0,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      net_available: netAvailable,
    };
  }
}

export default new StoreInventoryService();
