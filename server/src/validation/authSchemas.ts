/**
 * Authentication Request Validation Schemas
 *
 * Strict Zod schemas for all auth-related request bodies.
 * These are enforced at the route level via the validate() middleware,
 * ensuring controllers only receive pre-validated, typed data.
 *
 * NOTE: Uses Zod v4 API — error messages use `{ error: '...' }` syntax.
 */

import { z } from 'zod';

// ─── Register ────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
    firstName: z
        .string({ error: 'First name is required' })
        .trim()
        .min(1, 'First name is required')
        .max(50, 'First name must be 50 characters or less'),
    lastName: z
        .string({ error: 'Last name is required' })
        .trim()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be 50 characters or less'),
    email: z
        .string({ error: 'Email is required' })
        .email('Invalid email address')
        .transform((val) => val.toLowerCase().trim()),
    password: z
        .string({ error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
    email: z
        .string({ error: 'Email is required' })
        .email('Invalid email address')
        .transform((val) => val.toLowerCase().trim()),
    password: z
        .string({ error: 'Password is required' })
        .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Forgot Password ────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
    email: z
        .string({ error: 'Email is required' })
        .email('Invalid email address')
        .transform((val) => val.toLowerCase().trim()),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ─────────────────────────────────────────────────────────

export const resetPasswordSchema = z.object({
    token: z
        .string({ error: 'Reset token is required' })
        .min(1, 'Reset token is required'),
    newPassword: z
        .string({ error: 'New password is required' })
        .min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Update Profile ──────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, 'First name cannot be empty')
        .max(50, 'First name must be 50 characters or less')
        .optional(),
    lastName: z
        .string()
        .trim()
        .min(1, 'Last name cannot be empty')
        .max(50, 'Last name must be 50 characters or less')
        .optional(),
    avatarUrl: z
        .string()
        .trim()
        .nullable()
        .optional(),
}).refine(
    (data) => data.firstName !== undefined || data.lastName !== undefined || data.avatarUrl !== undefined,
    { message: 'At least one field must be provided' }
);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─── Exchange One-Time OAuth Code ────────────────────────────────────────────

export const exchangeOAuthCodeSchema = z.object({
    code: z
        .string({ error: 'Code is required' })
        .min(1, 'Code is required')
        .max(200, 'Invalid code'),
});

export type ExchangeOAuthCodeInput = z.infer<typeof exchangeOAuthCodeSchema>;
