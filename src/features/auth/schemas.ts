/**
 * Auth feature Zod schemas (request validation).
 *
 * These mirror the web frontend's `lib/validation.ts` auth schemas, reconciled
 * with the backend gateway contract.
 */
import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(
      /^[a-z][a-z0-9_-]*$/,
      'Username must be lowercase, start with a letter, and only contain letters, numbers, underscores, or hyphens',
    ),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const VerifyEmailRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

export const ResendVerificationRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResendVerificationRequest = z.infer<typeof ResendVerificationRequestSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const GoogleLoginRequestSchema = z.object({
  authorizationCode: z.string().min(1, 'Authorization code is required'),
  redirectUri: z.string().optional(),
});

export type GoogleLoginRequest = z.infer<typeof GoogleLoginRequestSchema>;

export const AppleLoginRequestSchema = z.object({
  authorizationCode: z.string().optional(),
  identityToken: z.string().min(1, 'Identity token is required'),
  nonce: z.string().optional(),
  fullName: z
    .object({
      givenName: z.string().optional(),
      familyName: z.string().optional(),
    })
    .optional(),
  redirectUri: z.string().optional(),
});

export type AppleLoginRequest = z.infer<typeof AppleLoginRequestSchema>;
