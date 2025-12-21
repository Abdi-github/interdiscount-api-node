import { Request, Response, NextFunction } from 'express';
import ApiError from '../errors/ApiError';

/**
 * Role-based access control middleware.
 * Checks if the authenticated user has any of the required roles.
 */
const requireRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    const hasRole = req.user.roles.some((role) => roles.includes(role));
    if (!hasRole) {
      next(ApiError.forbidden('Insufficient role permissions'));
      return;
    }

    next();
  };
};

/**
 * Permission-based access control middleware.
 * Checks if the authenticated user has all of the required permissions.
 */
const requirePermissions = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    const hasAll = permissions.every((perm) => req.user!.permissions.includes(perm));
    if (!hasAll) {
      next(ApiError.forbidden('Insufficient permissions'));
      return;
    }

    next();
  };
};

/**
 * Store ownership middleware.
 * Ensures store manager can only access their assigned store.
 */
const requireStoreAccess = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(ApiError.unauthorized('Authentication required'));
    return;
  }

  // Super admins and admins can access any store
  if (req.user.roles.includes('super_admin') || req.user.roles.includes('admin')) {
    next();
    return;
  }

  // Store managers must have a store_id assigned
  if (!req.user.store_id) {
    next(ApiError.forbidden('No store assigned to this user'));
    return;
  }

  next();
};

export { requireRoles, requirePermissions, requireStoreAccess };
