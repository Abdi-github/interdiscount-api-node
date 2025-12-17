import Role, { IRole } from '../roles/role.model';
import Permission, { IPermission } from '../permissions/permission.model';
import RolePermission from '../permissions/rolePermission.model';
import ApiError from '../../shared/errors/ApiError';
import { parsePagination } from '../../shared/utils/formatters';
import logger from '../../shared/logger';

class AdminRbacService {
  // ─── ROLES ──────────────────────────

  /**
   * List roles.
   */
  async listRoles(query: {
    page?: string;
    limit?: string;
    is_active?: string;
  }): Promise<{ roles: IRole[]; total: number; page: number; limit: number }> {
    // logger.debug('AdminRbacService listRoles - fetching all roles');
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    }

    const [roles, total] = await Promise.all([
      Role.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Role.countDocuments(filter),
    ]);
    // TODO: Implement role hierarchy validation

    return { roles, total, page, limit };
  }

  /**
   * Create role.
   */
  async createRole(input: {
    name: string;
    display_name: Record<string, string>;
    description: Record<string, string>;
    is_system?: boolean;
    is_active?: boolean;
  }): Promise<IRole> {
    /* logger.debug('AdminRbacService createRole - validating new role'); */
    const existing = await Role.findOne({ name: input.name }).lean();
    if (existing) {
      throw ApiError.conflict('Role name already exists', 'name');
    }

    const role = await Role.create(input);
    logger.info('Admin created role', { roleId: role._id.toString(), name: input.name });
    return role.toObject();
  }

  /**
   * Update role.
   */
  async updateRole(roleId: string, input: Record<string, unknown>): Promise<IRole> {
    const role = await Role.findById(roleId);
    if (!role) {
      throw ApiError.notFound('Role');
    }

    if (role.is_system && input.is_active === false) {
      throw ApiError.badRequest('Cannot deactivate a system role');
    }

    if (input.display_name) role.display_name = input.display_name as typeof role.display_name;
    if (input.description) role.description = input.description as typeof role.description;
    if (input.is_active !== undefined) role.is_active = input.is_active as boolean;

    await role.save();
    logger.info('Admin updated role', { roleId });
    return role.toObject();
  }

  // ─── PERMISSIONS ──────────────────────────

  /**
   * List permissions.
   */
  async listPermissions(query: {
    page?: string;
    limit?: string;
    resource?: string;
    is_active?: string;
  }): Promise<{ permissions: IPermission[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};

    if (query.resource) filter.resource = query.resource;
    if (query.is_active !== undefined) {
      filter.is_active = query.is_active === 'true';
    }

    const [permissions, total] = await Promise.all([
      Permission.find(filter).sort({ resource: 1, action: 1 }).skip(skip).limit(limit).lean(),
      Permission.countDocuments(filter),
    ]);

    return { permissions, total, page, limit };
  }

  // ─── ROLE PERMISSIONS ──────────────────────────

  /**
   * Get permissions assigned to a role.
   */
  async getRolePermissions(roleId: string): Promise<unknown[]> {
    const role = await Role.findById(roleId).lean();
    if (!role) {
      throw ApiError.notFound('Role');
    }

    const rolePermissions = await RolePermission.find({ role_id: roleId })
      .populate('permission_id')
      .lean();

    return rolePermissions.map((rp) => rp.permission_id);
  }

  /**
   * Update role permissions (replaces all current permissions).
   */
  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<unknown[]> {
    const role = await Role.findById(roleId).lean();
    if (!role) {
      throw ApiError.notFound('Role');
    }

    // Validate all permission IDs
    if (permissionIds.length > 0) {
      const permissions = await Permission.find({ _id: { $in: permissionIds } }).lean();
      if (permissions.length !== permissionIds.length) {
        throw ApiError.badRequest('One or more permission IDs are invalid');
      }
    }

    // Remove existing role permissions
    await RolePermission.deleteMany({ role_id: roleId });

    // Create new role permissions
    if (permissionIds.length > 0) {
      const newRolePermissions = permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      await RolePermission.insertMany(newRolePermissions);
    }

    logger.info('Admin updated role permissions', { roleId, permissionCount: permissionIds.length });

    return this.getRolePermissions(roleId);
  }
}

export default new AdminRbacService();
