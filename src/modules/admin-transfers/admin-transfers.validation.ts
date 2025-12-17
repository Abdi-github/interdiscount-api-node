import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const listAdminTransfersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']).optional(),
    from_store_id: z.string().optional(),
    to_store_id: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'status']).optional(),
  }),
});

export const transferIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid transfer ID'),
  }),
});

export const approveTransferSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid transfer ID'),
  }),
  body: z.object({
    action: z.enum(['approve', 'reject']),
    notes: z.string().max(500).optional(),
  }),
});
