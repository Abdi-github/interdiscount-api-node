import { z } from 'zod/v4';

const SWISS_CANTON_CODES = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
  'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
  'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH',
] as const;

const addressBody = z.object({
  label: z.string().min(1, 'Label is required').max(50).trim(),
  first_name: z.string().min(1, 'First name is required').max(50).trim(),
  last_name: z.string().min(1, 'Last name is required').max(50).trim(),
  street: z.string().min(1, 'Street is required').max(200).trim(),
  street_number: z.string().min(1, 'Street number is required').max(20).trim(),
  postal_code: z.string().min(4, 'Postal code must be at least 4 digits').max(10).trim(),
  city: z.string().min(1, 'City is required').max(100).trim(),
  canton_code: z.enum(SWISS_CANTON_CODES, { message: 'Invalid Swiss canton code' }),
  country: z.string().max(5).default('CH').optional(),
  phone: z.string().max(20).optional(),
  is_default: z.boolean().optional(),
  is_billing: z.boolean().optional(),
});

export const createAddressSchema = z.object({
  body: addressBody,
});

export const updateAddressSchema = z.object({
  body: addressBody.partial(),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const addressParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
