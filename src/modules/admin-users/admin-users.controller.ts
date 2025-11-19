import { Request, Response } from 'express';
import adminUsersService from './admin-users.service';
import ApiResponse from '../../shared/utils/ApiResponse';
import asyncHandler from '../../shared/utils/asyncHandler';

class AdminUsersController {
  /**
   * GET /admin/users
   */
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as Record<string, string>;
    const { users, total, page, limit } = await adminUsersService.list(query);
    ApiResponse.paginated(res, users, total, page, limit, 'Users fetched');
  });

  /**
   * GET /admin/users/:id
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const user = await adminUsersService.getById(id);
    ApiResponse.success(res, user, 'User fetched');
  });

  /**
   * PUT /admin/users/:id
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const user = await adminUsersService.update(id, req.body);
    ApiResponse.success(res, user, 'User updated');
  });

  /**
   * PUT /admin/users/:id/status
   */
  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const user = await adminUsersService.updateStatus(id, req.body.is_active);
    ApiResponse.success(res, user, `User ${req.body.is_active ? 'activated' : 'deactivated'}`);
  });

  /**
   * GET /admin/users/:id/roles
   */
  getUserRoles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const roles = await adminUsersService.getUserRoles(id);
    ApiResponse.success(res, roles, 'User roles fetched');
  });

  /**
   * PUT /admin/users/:id/roles
   */
  updateUserRoles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const roles = await adminUsersService.updateUserRoles(id, req.body.role_ids, req.user!._id);
    ApiResponse.success(res, roles, 'User roles updated');
  });
}

export default new AdminUsersController();
