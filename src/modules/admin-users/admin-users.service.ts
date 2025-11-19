import User, { IUser } from '../users/user.model';
import UserRole from '../roles/userRole.model';
import Role from '../roles/role.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class AdminUsersService {
  /**
   * List all users with filters, search, sorting, pagination.
   */
  async list(query: {
    page?: string;
    limit?: string;
    q?: string;
    user_type?: string;
    is_active?: string;
    is_verified?: string;
    sort?: string;
  }): Promise<{ users: IUser[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.user_type) {
      filter.user_type = query.user_type;
    }
    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    }
    if (query.is_verified !== undefined) {
      filter.is_verified = query.is_verified === 'true';
    }
    if (query.q) {
      const regex = new RegExp(query.q, 'i');
      filter.$or = [
        { email: regex },
        { first_name: regex },
        { last_name: regex },
      ];
    }

    let sortObj: Record<string, 1 | -1> = { created_at: -1 };
    switch (query.sort) {
      case 'oldest':
        sortObj = { created_at: 1 };
        break;
      case 'name':
        sortObj = { first_name: 1, last_name: 1 };
        break;
      case 'email':
        sortObj = { email: 1 };
        break;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password_hash -verification_token -verification_token_expires -reset_password_token -reset_password_expires')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return { users, total, page, limit };
  }

  /**
   * Get user detail by ID.
   */
  async getById(userId: string): Promise<IUser> {
    const user = await User.findById(userId)
      .select('-password_hash -verification_token -verification_token_expires -reset_password_token -reset_password_expires')
      .lean();

    if (!user) {
      throw ApiError.notFound('User');
    }

    return user;
  }

  /**
   * Update user.
   */
  async update(userId: string, input: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    preferred_language?: string;
    user_type?: string;
    store_id?: string | null;
  }): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User');
    }

    if (input.first_name !== undefined) user.first_name = input.first_name;
    if (input.last_name !== undefined) user.last_name = input.last_name;
    if (input.phone !== undefined) user.phone = input.phone;
    if (input.preferred_language !== undefined) user.preferred_language = input.preferred_language;
    if (input.user_type !== undefined) user.user_type = input.user_type;
    if (input.store_id !== undefined) user.store_id = input.store_id as unknown as typeof user.store_id;

    await user.save();

    const updated = await User.findById(userId)
      .select('-password_hash -verification_token -verification_token_expires -reset_password_token -reset_password_expires')
      .lean();

    logger.info('Admin updated user', { userId });
    return updated!;
  }

  /**
   * Activate/deactivate user.
   */
  async updateStatus(userId: string, isActive: boolean): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User');
    }

    user.is_active = isActive;
    await user.save();

    const updated = await User.findById(userId)
      .select('-password_hash -verification_token -verification_token_expires -reset_password_token -reset_password_expires')
      .lean();

    logger.info(`Admin ${isActive ? 'activated' : 'deactivated'} user`, { userId });
    return updated!;
  }

  /**
   * Get user roles.
   */
  async getUserRoles(userId: string): Promise<unknown[]> {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw ApiError.notFound('User');
    }

    const userRoles = await UserRole.find({ user_id: userId })
      .populate('role_id')
      .lean();

    return userRoles.map((ur) => ({
      _id: ur._id,
      role: ur.role_id,
      is_active: ur.is_active,
      assigned_at: ur.assigned_at,
    }));
  }

  /**
   * Assign roles to user (replaces all current roles).
   */
  async updateUserRoles(
    userId: string,
    roleIds: string[],
    assignedBy: string,
  ): Promise<unknown[]> {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw ApiError.notFound('User');
    }

    // Validate all role IDs exist
    const roles = await Role.find({ _id: { $in: roleIds } }).lean();
    if (roles.length !== roleIds.length) {
      throw ApiError.badRequest('One or more role IDs are invalid');
    }

    // Remove existing roles
    await UserRole.deleteMany({ user_id: userId });

    // Create new role assignments
    const newUserRoles = roleIds.map((roleId) => ({
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
      assigned_at: new Date(),
      is_active: true,
    }));

    await UserRole.insertMany(newUserRoles);

    logger.info('Admin updated user roles', { userId, roleIds });

    // Return updated roles
    return this.getUserRoles(userId);
  }
}

export default new AdminUsersService();
