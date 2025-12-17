import { Request, Response } from 'express';
import adminRbacService from './admin-rbac.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

/**
 * GET /admin/rbac/roles
 */
export const listRoles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { roles, total, page, limit } = await adminRbacService.listRoles(
    req.query as Record<string, string>,
  );
  ApiResponse.paginated(res, roles, total, page, limit, 'Roles retrieved');
});

/**
 * POST /admin/rbac/roles
 */
export const createRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const role = await adminRbacService.createRole(req.body);
  ApiResponse.created(res, role, 'Role created');
});

/**
 * PUT /admin/rbac/roles/:id
 */
export const updateRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const role = await adminRbacService.updateRole(req.params.id as string, req.body);
  ApiResponse.success(res, role, 'Role updated');
});

/**
 * GET /admin/rbac/permissions
 */
export const listPermissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { permissions, total, page, limit } = await adminRbacService.listPermissions(
      req.query as Record<string, string>,
    );
    ApiResponse.paginated(res, permissions, total, page, limit, 'Permissions retrieved');
  },
);

/**
 * GET /admin/rbac/roles/:id/permissions
 */
export const getRolePermissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const permissions = await adminRbacService.getRolePermissions(req.params.id as string);
    ApiResponse.success(res, permissions, 'Role permissions retrieved');
  },
);

/**
 * PUT /admin/rbac/roles/:id/permissions
 */
export const updateRolePermissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const permissions = await adminRbacService.updateRolePermissions(
      req.params.id as string,
      req.body.permission_ids,
    );
    ApiResponse.success(res, permissions, 'Role permissions updated');
  },
);
