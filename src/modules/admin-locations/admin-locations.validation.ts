import { z } from 'zod/v4';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const translationInput = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
  de: z.string().min(1),
  it: z.string().min(1),
});

export const locationIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid ID'),
  }),
});

export const createCantonSchema = z.object({
  body: z.object({
    name: translationInput,
    slug: z.string().min(1).max(100).trim(),
    code: z.string().min(2).max(2).trim().transform((v) => v.toUpperCase()),
    is_active: z.boolean().optional(),
  }),
});

export const updateCantonSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid canton ID'),
  }),
  body: z.object({
    name: translationInput.optional(),
    slug: z.string().min(1).max(100).trim().optional(),
    code: z.string().min(2).max(2).trim().transform((v) => v.toUpperCase()).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const createCitySchema = z.object({
  body: z.object({
    name: translationInput,
    slug: z.string().min(1).max(200).trim(),
    canton_id: z.string().regex(objectIdRegex),
    postal_codes: z.array(z.string().min(1).max(10)).min(1),
    is_active: z.boolean().optional(),
  }),
});

export const updateCitySchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid city ID'),
  }),
  body: z.object({
    name: translationInput.optional(),
    slug: z.string().min(1).max(200).trim().optional(),
    canton_id: z.string().regex(objectIdRegex).optional(),
    postal_codes: z.array(z.string().min(1).max(10)).optional(),
    is_active: z.boolean().optional(),
  }),
});
