import { z } from 'zod';

const updateProfileSchema = z.object({
  body: z.object({
    first_name: z.string().min(1).max(50).trim().optional(),
    last_name: z.string().min(1).max(50).trim().optional(),
    phone: z.string().max(20).optional(),
    preferred_language: z.enum(['de', 'en', 'fr', 'it']).optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
        'Password must contain uppercase, lowercase, number, and special character',
      ),
  }),
});

export { updateProfileSchema, changePasswordSchema };
