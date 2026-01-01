import Address, { IAddress } from './address.model';
import ApiError from '../../shared/errors/ApiError';
import logger from '../../shared/logger';

interface ICreateAddressInput {
  label: string;
  first_name: string;
  last_name: string;
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  canton_code: string;
  country?: string;
  phone?: string;
  is_default?: boolean;
  is_billing?: boolean;
}

class AddressService {
  /**
   * List all addresses for a user.
   */
  async list(userId: string): Promise<IAddress[]> {
    const addresses = await Address.find({ user_id: userId })
      .sort({ is_default: -1, created_at: -1 })
      .lean();
    return addresses;
  }

  /**
   * Create a new address.
   */
  async create(userId: string, input: ICreateAddressInput): Promise<IAddress> {
    // If this is the first address or marked as default, handle default logic
    if (input.is_default) {
      await Address.updateMany(
        { user_id: userId, is_default: true },
        { is_default: false },
      );
    }

    // If no addresses exist, make this the default
    const count = await Address.countDocuments({ user_id: userId });
    if (count === 0) {
      input.is_default = true;
      input.is_billing = true;
    }

    const address = await Address.create({
      user_id: userId,
      ...input,
    });

    logger.info('Address created', { userId, addressId: address._id.toString() });

    return address.toObject();
  }

  /**
   * Update an address.
   */
  async update(userId: string, addressId: string, input: Partial<ICreateAddressInput>): Promise<IAddress> {
    const address = await Address.findOne({ _id: addressId, user_id: userId });
    if (!address) {
      throw ApiError.notFound('Address');
    }

    // If setting as default, unset other defaults
    if (input.is_default === true) {
      await Address.updateMany(
        { user_id: userId, _id: { $ne: addressId }, is_default: true },
        { is_default: false },
      );
    }

    Object.assign(address, input);
    await address.save();

    logger.info('Address updated', { userId, addressId });

    return address.toObject();
  }

  /**
   * Delete an address.
   */
  async delete(userId: string, addressId: string): Promise<void> {
    const address = await Address.findOne({ _id: addressId, user_id: userId });
    if (!address) {
      throw ApiError.notFound('Address');
    }

    const wasDefault = address.is_default;
    await Address.deleteOne({ _id: addressId });

    // If deleted address was default, make the most recent one default
    if (wasDefault) {
      const nextDefault = await Address.findOne({ user_id: userId })
        .sort({ created_at: -1 });
      if (nextDefault) {
        nextDefault.is_default = true;
        await nextDefault.save();
      }
    }

    logger.info('Address deleted', { userId, addressId });
  }

  /**
   * Set an address as default.
   */
  async setDefault(userId: string, addressId: string): Promise<IAddress> {
    const address = await Address.findOne({ _id: addressId, user_id: userId });
    if (!address) {
      throw ApiError.notFound('Address');
    }

    // Unset all other defaults
    await Address.updateMany(
      { user_id: userId, _id: { $ne: addressId }, is_default: true },
      { is_default: false },
    );

    address.is_default = true;
    await address.save();

    logger.info('Default address set', { userId, addressId });

    return address.toObject();
  }
}

export default new AddressService();
