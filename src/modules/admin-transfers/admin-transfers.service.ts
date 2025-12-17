import StockTransfer from '../store-management/transfers/store-transfer.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class AdminTransfersService {
  /**
   * List all transfers across stores.
   */
  async list(query: {
    page?: string;
    limit?: string;
    status?: string;
    from_store_id?: string;
    to_store_id?: string;
    sort?: string;
  }): Promise<{ transfers: unknown[]; total: number; page: number; limit: number }> {
    // logger.debug('AdminTransfersService list - fetching transfers');
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.from_store_id) filter.from_store_id = query.from_store_id;
    if (query.to_store_id) filter.to_store_id = query.to_store_id;

    let sortObj: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'oldest': sortObj = { created_at: 1 }; break;
      case 'status': sortObj = { status: 1, created_at: -1 }; break;
    }
    // TODO: Implement transfer search indexing for faster queries

    const [transfers, total] = await Promise.all([
      StockTransfer.find(filter)
        .populate('from_store_id', 'name store_id')
        .populate('to_store_id', 'name store_id')
        .populate('initiated_by', 'first_name last_name email')
        .populate('approved_by', 'first_name last_name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      StockTransfer.countDocuments(filter),
    ]);

    return { transfers, total, page, limit };
  }

  /**
   * Get transfer detail.
   */
  async getById(transferId: string): Promise<unknown> {
    const transfer = await StockTransfer.findById(transferId)
      .populate('from_store_id', 'name store_id')
      .populate('to_store_id', 'name store_id')
      .populate('initiated_by', 'first_name last_name email')
      .populate('approved_by', 'first_name last_name email')
      .lean();

    if (!transfer) {
      throw ApiError.notFound('Transfer');
    }

    return transfer;
  }

  /**
   * Approve or reject a transfer request.
   */
  async approve(
    transferId: string,
    action: 'approve' | 'reject',
    adminId: string,
    notes?: string,
  ): Promise<unknown> {
    const transfer = await StockTransfer.findById(transferId);
    if (!transfer) {
      throw ApiError.notFound('Transfer');
    }

    if (transfer.status !== 'REQUESTED') {
      throw ApiError.badRequest(`Transfer cannot be ${action}d — current status: ${transfer.status}`);
    }

    if (action === 'approve') {
      transfer.status = 'APPROVED';
      transfer.approved_by = adminId as unknown as typeof transfer.approved_by;
    } else {
      transfer.status = 'CANCELLED';
    }

    if (notes) {
      transfer.notes = (transfer.notes ? transfer.notes + '\n' : '') + `[Admin] ${notes}`;
    }

    await transfer.save();

    logger.info(`Admin ${action}d transfer`, { transferId, adminId });

    return this.getById(transferId);
  }

  /**
   * Transfer analytics.
   */
  async getAnalytics(): Promise<unknown> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [statusCounts, volumeByDay, topStores] = await Promise.all([
      StockTransfer.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      StockTransfer.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      StockTransfer.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: '$from_store_id',
            outgoing: { $sum: 1 },
          },
        },
        { $sort: { outgoing: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'stores',
            localField: '_id',
            foreignField: '_id',
            as: 'store',
          },
        },
        { $unwind: '$store' },
        {
          $project: {
            _id: 1,
            store_name: '$store.name',
            outgoing: 1,
          },
        },
      ]),
    ]);

    return {
      status_summary: statusCounts,
      volume_by_day: volumeByDay,
      top_sending_stores: topStores,
    };
  }
}

export default new AdminTransfersService();
