import StockTransfer from './store-transfer.model';
import Product from '../../products/product.model';
import Store from '../../stores/store.model';
import StoreInventory from '../inventory/store-inventory.model';
import ApiError from '../../../shared/errors/ApiError';
import { generateTransferNumber, parsePagination } from '../../../shared/utils/formatters';
import logger from '../../../shared/logger';
import { TRANSFER_STATUSES, IStockTransfer } from './store-transfer.types';


/**
 * Stock Transfer Service — inter-store stock transfer management.
 */
class StoreTransferService {
  /**
   * List transfers for a store (sent + received).
   */
  async list(
    storeId: string,
    query: { page?: string; limit?: string; status?: string; direction?: string; sort?: string },
  ): Promise<{ transfers: IStockTransfer[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });

    const filter: Record<string, unknown> = {};

    // Direction filter
    switch (query.direction) {
      case 'incoming':
        filter.to_store_id = storeId;
        break;
      case 'outgoing':
        filter.from_store_id = storeId;
        break;
      default:
        filter.$or = [{ from_store_id: storeId }, { to_store_id: storeId }];
    }

    if (query.status) {
      filter.status = query.status;
    }

    let sortObj: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'oldest':
        sortObj = { created_at: 1 };
        break;
      case 'status':
        sortObj = { status: 1, created_at: -1 };
        break;
    }

    const [transfers, total] = await Promise.all([
      StockTransfer.find(filter)
        .populate('from_store_id', 'name slug store_id')
        .populate('to_store_id', 'name slug store_id')
        .populate('initiated_by', 'first_name last_name email')
        .populate('approved_by', 'first_name last_name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      StockTransfer.countDocuments(filter),
    ]);

    return { transfers: transfers as unknown as IStockTransfer[], total, page, limit };
  }

  /**
   * Create a transfer request (store manager requests stock from another store).
   */
  async create(
    requestingStoreId: string,
    userId: string,
    data: {
      from_store_id: string;
      items: Array<{ product_id: string; quantity: number }>;
      notes?: string;
    },
  ): Promise<IStockTransfer> {
    // Cannot transfer to yourself
    if (data.from_store_id === requestingStoreId) {
      throw ApiError.badRequest('Cannot request transfer from your own store');
    }

    // Validate source store exists
    const sourceStore = await Store.findById(data.from_store_id).lean();
    if (!sourceStore || !sourceStore.is_active) {
      throw ApiError.notFound('Source store not found or inactive');
    }

    // Validate destination store exists
    const destStore = await Store.findById(requestingStoreId).lean();
    if (!destStore || !destStore.is_active) {
      throw ApiError.notFound('Your store not found or inactive');
    }

    // Validate products and build items with names
    const transferItems = [];
    for (const item of data.items) {
      const product = await Product.findById(item.product_id).lean();
      if (!product) {
        throw ApiError.notFound(`Product not found: ${item.product_id}`);
      }
      transferItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        received_quantity: 0,
      });
    }

    const transfer = await StockTransfer.create({
      transfer_number: generateTransferNumber(),
      from_store_id: data.from_store_id,
      to_store_id: requestingStoreId,
      initiated_by: userId,
      status: TRANSFER_STATUSES.REQUESTED,
      items: transferItems,
      notes: data.notes || '',
    });

    const populated = await StockTransfer.findById(transfer._id)
      .populate('from_store_id', 'name slug store_id')
      .populate('to_store_id', 'name slug store_id')
      .populate('initiated_by', 'first_name last_name email')
      .lean();

    logger.info(`Stock transfer requested: ${transfer.transfer_number}, from=${data.from_store_id}, to=${requestingStoreId}`);

    return populated as unknown as IStockTransfer;
  }

  /**
   * Get transfer by ID — scoped to store.
   */
  async getById(storeId: string, transferId: string): Promise<IStockTransfer> {
    const transfer = await StockTransfer.findOne({
      _id: transferId,
      $or: [{ from_store_id: storeId }, { to_store_id: storeId }],
    })
      .populate('from_store_id', 'name slug store_id')
      .populate('to_store_id', 'name slug store_id')
      .populate('initiated_by', 'first_name last_name email')
      .populate('approved_by', 'first_name last_name email')
      .lean();

    if (!transfer) {
      throw ApiError.notFound('Transfer not found or not associated with your store');
    }

    return transfer as unknown as IStockTransfer;
  }

  /**
   * Ship transfer — source store marks as shipped (APPROVED → IN_TRANSIT).
   * Decrements source store inventory.
   */
  async ship(storeId: string, transferId: string): Promise<IStockTransfer> {
    const transfer = await StockTransfer.findOne({
      _id: transferId,
      from_store_id: storeId,
    });

    if (!transfer) {
      throw ApiError.notFound('Transfer not found or you are not the source store');
    }

    if (transfer.status !== TRANSFER_STATUSES.APPROVED) {
      throw ApiError.badRequest(`Cannot ship transfer in status "${transfer.status}". Must be APPROVED.`);
    }

    // Decrement source store inventory
    for (const item of transfer.items) {
      await StoreInventory.findOneAndUpdate(
        { store_id: storeId, product_id: item.product_id },
        { $inc: { quantity: -item.quantity } },
      );
    }

    transfer.status = TRANSFER_STATUSES.IN_TRANSIT;
    transfer.shipped_at = new Date();
    await transfer.save();

    logger.info(`Stock transfer shipped: ${transfer.transfer_number}`);

    return transfer.toObject() as unknown as IStockTransfer;
  }

  /**
   * Receive transfer — destination store confirms receipt (IN_TRANSIT → RECEIVED).
   * Increments destination store inventory with actual received quantities.
   */
  async receive(
    storeId: string,
    transferId: string,
    receivedItems: Array<{ product_id: string; received_quantity: number }>,
    notes?: string,
  ): Promise<IStockTransfer> {
    const transfer = await StockTransfer.findOne({
      _id: transferId,
      to_store_id: storeId,
    });

    if (!transfer) {
      throw ApiError.notFound('Transfer not found or you are not the destination store');
    }

    if (transfer.status !== TRANSFER_STATUSES.IN_TRANSIT) {
      throw ApiError.badRequest(`Cannot receive transfer in status "${transfer.status}". Must be IN_TRANSIT.`);
    }

    // Update received quantities
    for (const received of receivedItems) {
      const transferItem = transfer.items.find(
        (i) => i.product_id.toString() === received.product_id,
      );
      if (transferItem) {
        transferItem.received_quantity = received.received_quantity;

        // Increment destination store inventory
        await StoreInventory.findOneAndUpdate(
          { store_id: storeId, product_id: received.product_id },
          {
            $inc: { quantity: received.received_quantity },
            $set: { last_restock_at: new Date() },
          },
          { upsert: true, setDefaultsOnInsert: true },
        );
      }
    }

    transfer.status = TRANSFER_STATUSES.RECEIVED;
    transfer.received_at = new Date();
    if (notes) {
      transfer.notes = transfer.notes ? `${transfer.notes} | Received: ${notes}` : notes;
    }
    await transfer.save();

    logger.info(`Stock transfer received: ${transfer.transfer_number}`);

    return transfer.toObject() as unknown as IStockTransfer;
  }

  /**
   * Cancel transfer — only if REQUESTED or APPROVED.
   */
  async cancel(storeId: string, transferId: string, reason?: string): Promise<IStockTransfer> {
    const transfer = await StockTransfer.findOne({
      _id: transferId,
      $or: [{ from_store_id: storeId }, { to_store_id: storeId }],
    });

    if (!transfer) {
      throw ApiError.notFound('Transfer not found or not associated with your store');
    }

    if (transfer.status !== TRANSFER_STATUSES.REQUESTED && transfer.status !== TRANSFER_STATUSES.APPROVED) {
      throw ApiError.badRequest(`Cannot cancel transfer in status "${transfer.status}".`);
    }

    transfer.status = TRANSFER_STATUSES.CANCELLED;
    if (reason) {
      transfer.notes = transfer.notes ? `${transfer.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`;
    }
    await transfer.save();

    logger.info(`Stock transfer cancelled: ${transfer.transfer_number}, reason: ${reason || 'N/A'}`);

    return transfer.toObject() as unknown as IStockTransfer;
  }
}

export default new StoreTransferService();
