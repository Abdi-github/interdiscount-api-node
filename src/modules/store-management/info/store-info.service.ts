import Store from '../../stores/store.model';
import User from '../../users/user.model';
import ApiError from '../../../shared/errors/ApiError';
import logger from '../../../shared/logger';

/**
 * Store Info Service — store details and staff for store managers.
 */
class StoreInfoService {
  /**
   * Get store info for the manager's assigned store.
   */
  async getStoreInfo(storeId: string): Promise<unknown> {
    const store = await Store.findById(storeId)
      .populate('city_id', 'name slug postal_codes')
      .populate('canton_id', 'name code')
      .lean();

    if (!store) {
      throw ApiError.notFound('Store not found');
    }

    return store;
  }

  /**
   * Update store info (phone, email, remarks, opening hours).
   */
  async updateStoreInfo(
    storeId: string,
    data: {
      phone?: string;
      email?: string;
      remarks?: string;
      opening_hours?: Record<string, { open: string; close: string } | null>;
    },
  ): Promise<unknown> {
    const updateData: Record<string, unknown> = {};

    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;
    if (data.opening_hours !== undefined) {
      // Merge opening hours
      for (const [day, hours] of Object.entries(data.opening_hours)) {
        updateData[`opening_hours.${day}`] = hours;
      }
    }

    const store = await Store.findByIdAndUpdate(
      storeId,
      { $set: updateData },
      { new: true },
    )
      .populate('city_id', 'name slug postal_codes')
      .populate('canton_id', 'name code')
      .lean();

    if (!store) {
      throw ApiError.notFound('Store not found');
    }

    logger.info(`Store info updated: ${storeId}`);

    return store;
  }

  /**
   * List staff assigned to a store.
   */
  async getStaff(storeId: string): Promise<unknown[]> {
    const staff = await User.find({
      store_id: storeId,
      is_active: true,
    })
      .select('first_name last_name email phone user_type avatar_url last_login_at created_at')
      .sort({ last_name: 1, first_name: 1 })
      .lean();

    return staff;
  }
}

export default new StoreInfoService();
