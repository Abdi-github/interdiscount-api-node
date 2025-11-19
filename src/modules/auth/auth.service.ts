import crypto from 'crypto';
import User from '../users/user.model';
import UserRole from '../roles/userRole.model';
import Role from '../roles/role.model';
import RolePermission from '../permissions/rolePermission.model';
import Permission from '../permissions/permission.model';
import ApiError from '../../shared/errors/ApiError';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { generateTokenPair, verifyRefreshToken, ITokenPayload } from '../../shared/utils/jwt';
import logger from '../../shared/logger';
import { emailQueue } from '../../shared/queue/email.queue';
import {
  IRegisterInput,
  ILoginInput,
  IAuthResponse,
  IForgotPasswordInput,
  IResetPasswordInput,
} from './auth.types';

class AuthService {
  /**
   * Register a new customer account.
   */
  async register(input: IRegisterInput): Promise<IAuthResponse> {
    // Check if email already exists
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      throw ApiError.conflict('Email already registered', 'email');
    }

    // Hash password
    const password_hash = await hashPassword(input.password);

    // Generate verification token
    const verification_token = crypto.randomBytes(32).toString('hex');
    const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create user
    const user = await User.create({
      email: input.email,
      password_hash,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone || '',
      preferred_language: input.preferred_language || 'de',
      user_type: 'customer',
      is_active: true,
      is_verified: false,
      verification_token,
      verification_token_expires,
    });

    // Assign customer role
    const customerRole = await Role.findOne({ name: 'customer' }).lean();
    if (customerRole) {
      await UserRole.create({
        user_id: user._id,
        role_id: customerRole._id,
        assigned_at: new Date(),
        is_active: true,
      });
    }

    // Generate tokens
    const tokenPayload: ITokenPayload = {
      _id: user._id.toString(),
      email: user.email,
      user_type: user.user_type,
    };
    const tokens = generateTokenPair(tokenPayload);

    // Queue verification email
    await emailQueue.add('verification', {
      type: 'verification',
      to: user.email,
      firstName: user.first_name,
      verificationToken: verification_token,
      language: user.preferred_language || 'de',
    });

    logger.info(`New user registered: ${user.email}`, { userId: user._id });

    return {
      user: {
        _id: user._id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        preferred_language: user.preferred_language,
        is_verified: user.is_verified,
      },
      tokens: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      },
    };
  }

  /**
   * Login with email and password.
   */
  async login(input: ILoginInput): Promise<IAuthResponse> {
    // Find user
    const user = await User.findOne({ email: input.email });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if active
    if (!user.is_active) {
      throw ApiError.forbidden('Account is deactivated. Please contact support.');
    }

    // Verify password
    const isMatch = await comparePassword(input.password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    // Generate tokens
    const tokenPayload: ITokenPayload = {
      _id: user._id.toString(),
      email: user.email,
      user_type: user.user_type,
    };
    const tokens = generateTokenPair(tokenPayload);

    logger.info(`User logged in: ${user.email}`, { userId: user._id });

    return {
      user: {
        _id: user._id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        preferred_language: user.preferred_language,
        is_verified: user.is_verified,
      },
      tokens: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      },
    };
  }

  /**
   * Refresh access token using refresh token.
   */
  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const decoded = verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const user = await User.findById(decoded._id).lean();
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }
    if (!user.is_active) {
      throw ApiError.forbidden('Account is deactivated');
    }

    // Generate new tokens
    const tokenPayload: ITokenPayload = {
      _id: user._id.toString(),
      email: user.email,
      user_type: user.user_type,
    };
    const tokens = generateTokenPair(tokenPayload);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  /**
   * Verify email with token.
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({
      verification_token: token,
      verification_token_expires: { $gt: new Date() },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    user.is_verified = true;
    user.verified_at = new Date();
    user.verification_token = null;
    user.verification_token_expires = null;
    await user.save();

    logger.info(`Email verified: ${user.email}`, { userId: user._id });
  }

  /**
   * Request password reset email.
   */
  async forgotPassword(input: IForgotPasswordInput): Promise<void> {
    const user = await User.findOne({ email: input.email });

    // Don't reveal if user exists
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.reset_password_token = resetToken;
    user.reset_password_expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // Queue password reset email
    await emailQueue.add('password_reset', {
      type: 'password_reset',
      to: user.email,
      firstName: user.first_name,
      resetToken: resetToken,
      language: user.preferred_language || 'de',
    });

    logger.info(`Password reset requested: ${user.email}`, { userId: user._id });
  }

  /**
   * Reset password with token.
   */
  async resetPassword(input: IResetPasswordInput): Promise<void> {
    const user = await User.findOne({
      reset_password_token: input.token,
      reset_password_expires: { $gt: new Date() },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    user.password_hash = await hashPassword(input.password);
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    logger.info(`Password reset completed: ${user.email}`, { userId: user._id });
  }

  /**
   * Resend verification email.
   */
  async resendVerification(email: string): Promise<void> {
    const user = await User.findOne({ email });

    if (!user) {
      return; // Don't reveal if user exists
    }

    if (user.is_verified) {
      throw ApiError.badRequest('Email is already verified');
    }

    // Generate new verification token
    user.verification_token = crypto.randomBytes(32).toString('hex');
    user.verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Queue verification email
    await emailQueue.add('verification', {
      type: 'verification',
      to: user.email,
      firstName: user.first_name,
      verificationToken: user.verification_token,
      language: user.preferred_language || 'de',
    });

    logger.info(`Verification email resent: ${user.email}`, { userId: user._id });
  }

  /**
   * Get user roles and permissions for auth middleware population.
   */
  async getUserRolesAndPermissions(
    userId: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    // Get active roles for user
    const userRoles = await UserRole.find({ user_id: userId, is_active: true }).lean();
    const roleIds = userRoles.map((ur) => ur.role_id);

    // Get role names
    const roles = await Role.find({ _id: { $in: roleIds }, is_active: true }).lean();
    const roleNames = roles.map((r) => r.name);

    // Get permissions for these roles
    const rolePermissions = await RolePermission.find({ role_id: { $in: roleIds } }).lean();
    const permissionIds = rolePermissions.map((rp) => rp.permission_id);

    const permissions = await Permission.find({
      _id: { $in: permissionIds },
      is_active: true,
    }).lean();
    const permissionNames = permissions.map((p) => p.name);

    return { roles: roleNames, permissions: permissionNames };
  }
}

export default new AuthService();
