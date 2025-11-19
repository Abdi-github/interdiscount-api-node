import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    q: z.string().optional(),
    user_type: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
    is_verified: z.enum(['true', 'false']).optional(),
    sort: z.enum(['newest', 'oldest', 'name', 'email']).optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user ID'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user ID'),
  }),
  body: z.object({
    first_name: z.string().min(1).max(100).trim().optional(),
    last_name: z.string().min(1).max(100).trim().optional(),
    phone: z.string().max(30).trim().optional(),
    preferred_language: z.enum(['de', 'en', 'fr', 'it']).optional(),
    user_type: z.enum([
      'customer', 'staff', 'admin', 'store_manager', 'store_staff',
      'warehouse_staff', 'customer_support', 'platform_admin', 'super_admin', 'moderator',
    ]).optional(),
    store_id: z.string().regex(objectIdRegex, 'Invalid store ID').nullable().optional(),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user ID'),
  }),
  body: z.object({
    is_active: z.boolean(),
  }),
});

export const updateUserRolesSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user ID'),
  }),
  body: z.object({
    role_ids: z.array(z.string().regex(objectIdRegex, 'Invalid role ID')).min(1),
  }),
});
