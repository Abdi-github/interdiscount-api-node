import { Router } from 'express';
import {
  listRoles,
  createRole,
  updateRole,
  listPermissions,
  getRolePermissions,
  updateRolePermissions,
} from './admin-rbac.controller';
import validate from '../../shared/middlewares/validate';
import {
  listRolesSchema,
  roleIdParamSchema,
  createRoleSchema,
  updateRoleSchema,
  listPermissionsSchema,
  updateRolePermissionsSchema,
} from './admin-rbac.validation';

const router = Router();

// ─── Roles ──────────────────────────
router.get('/roles', validate(listRolesSchema), listRoles);
router.post('/roles', validate(createRoleSchema), createRole);
router.put('/roles/:id', validate(updateRoleSchema), updateRole);

// ─── Permissions ──────────────────────────
router.get('/permissions', validate(listPermissionsSchema), listPermissions);

// ─── Role Permissions ──────────────────────────
router.get('/roles/:id/permissions', validate(roleIdParamSchema), getRolePermissions);
router.put(
  '/roles/:id/permissions',
  validate(updateRolePermissionsSchema),
  updateRolePermissions,
);

export default router;
