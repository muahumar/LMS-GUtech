import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

// Password policy from spec: at least 10 characters, one letter and one number
export const passwordPolicy = z
  .string()
  .min(10, 'Password must be at least 10 characters long')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const resetPasswordSchema = z.object({
  newPassword: passwordPolicy,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordPolicy,
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must have at least 2 characters'),
});
