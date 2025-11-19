import User from './user.model';
import ApiError from '../../shared/errors/ApiError';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { cloudinary } from '../../config/cloudinary';
import logger from '../../shared/logger';
import { IUpdateProfileInput, IChangePasswordInput, IUserProfile } from './user.types';

class UserService {
  /**
   * Get user profile by ID.
   */
  async getProfile(userId: string): Promise<IUserProfile> {
    const user = await User.findById(userId)
      .select('-password_hash -verification_token -verification_token_expires -reset_password_token -reset_password_expires')
      .lean();

    if (!user) {
      throw ApiError.notFound('User');
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      preferred_language: user.preferred_language,
      user_type: user.user_type,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified,
      created_at: user.created_at,
    };
  }

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, input: IUpdateProfileInput): Promise<IUserProfile> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User');
    }

    if (input.first_name !== undefined) user.first_name = input.first_name;
    if (input.last_name !== undefined) user.last_name = input.last_name;
    if (input.phone !== undefined) user.phone = input.phone;
    if (input.preferred_language !== undefined) user.preferred_language = input.preferred_language;

    await user.save();

    logger.info(`Profile updated: ${user.email}`, { userId });

    return {
      _id: user._id.toString(),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      preferred_language: user.preferred_language,
      user_type: user.user_type,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified,
      created_at: user.created_at,
    };
  }

  /**
   * Change password.
   */
  async changePassword(userId: string, input: IChangePasswordInput): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User');
    }

    // Verify current password
    const isMatch = await comparePassword(input.current_password, user.password_hash);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect', 'current_password');
    }

    user.password_hash = await hashPassword(input.new_password);
    await user.save();

    logger.info(`Password changed: ${user.email}`, { userId });
  }

  /**
   * Upload avatar image.
   */
  async uploadAvatar(userId: string, fileBuffer: Buffer): Promise<string> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User');
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatar_url) {
      try {
        const publicId = this.extractCloudinaryPublicId(user.avatar_url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        logger.warn('Failed to delete old avatar from Cloudinary', { userId, error });
      }
    }

    // Upload new avatar
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'interdiscount/avatars',
          transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        },
      );
      stream.end(fileBuffer);
    });

    user.avatar_url = result.secure_url;
    await user.save();

    logger.info(`Avatar uploaded: ${user.email}`, { userId });

    return result.secure_url;
  }

  /**
   * Remove avatar.
   */
  async removeAvatar(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User');
    }

    if (user.avatar_url) {
      try {
        const publicId = this.extractCloudinaryPublicId(user.avatar_url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        logger.warn('Failed to delete avatar from Cloudinary', { userId, error });
      }
    }

    user.avatar_url = null;
    await user.save();

    logger.info(`Avatar removed: ${user.email}`, { userId });
  }

  /**
   * Extract Cloudinary public ID from URL.
   */
  private extractCloudinaryPublicId(url: string): string | null {
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

export default new UserService();
