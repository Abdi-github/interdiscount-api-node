import { z } from 'zod/v4';

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    is_read: z.enum(['true', 'false']).optional(),
    type: z.string().optional(),
  }),
});

export const notificationParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
