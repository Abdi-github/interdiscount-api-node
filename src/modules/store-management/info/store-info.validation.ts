import { z } from 'zod/v4';

/**
 * Update store info (hours, phone, remarks).
 */
export const updateStoreInfoSchema = z.object({
  body: z.object({
    phone: z.string().max(50).optional(),
    email: z.string().email().max(200).optional(),
    remarks: z.string().max(500).optional(),
    opening_hours: z.record(
      z.string(),
      z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
        close: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
      }).nullable(),
    ).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
