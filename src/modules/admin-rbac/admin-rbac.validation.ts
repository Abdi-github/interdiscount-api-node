import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const translationInput = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
  de: z.string().min(1),
  it: z.string().min(1),
});

export const listRolesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
  }),
});

export const roleIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid role ID'),
  }),
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim().transform((v) => v.toLowerCase()),
    display_name: translationInput,
    description: translationInput,
    is_system: z.boolean().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid role ID'),
  }),
  body: z.object({
    display_name: translationInput.optional(),
    description: translationInput.optional(),
    is_active: z.boolean().optional(),
  }),
});

export const listPermissionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    resource: z.string().optional(),
    is_active: z.enum(['true', 'false']).optional(),
  }),
});

export const updateRolePermissionsSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid role ID'),
  }),
  body: z.object({
    permission_ids: z.array(z.string().regex(objectIdRegex, 'Invalid permission ID')).min(0),
  }),
});
