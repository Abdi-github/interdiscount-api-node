import { Request, Response, NextFunction } from 'express';
import ApiError from '../errors/ApiError';
import { verifyAccessToken } from '../utils/jwt';
import User from '../../modules/users/user.model';
import authService from '../../modules/auth/auth.service';
import logger from '../logger';

const auth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Access token is required'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // Fetch full user from DB
    const user = await User.findById(decoded._id).lean();
    if (!user) {
      next(ApiError.unauthorized('User not found'));
      return;
    }

    if (!user.is_active) {
      next(ApiError.forbidden('Account is deactivated'));
      return;
    }

    // Get roles and permissions
    const { roles, permissions } = await authService.getUserRolesAndPermissions(
      user._id.toString(),
    );

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      store_id: user.store_id?.toString(),
      roles,
      permissions,
    };

    next();
  } catch (error) {
    logger.debug('Token verification failed', { requestId: req.requestId, error });
    next(ApiError.unauthorized('Invalid or expired access token'));
  }
};

export default auth;
