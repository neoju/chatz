import { z } from 'zod/v4';

export const ForgotPasswordRequestSchema = z
  .object({
    email: z.email().describe('User email address for password reset')
  })
  .describe('Forgot password request body');

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ForgotPasswordResponseSchema = z
  .object({
    message: z.string().describe('Status message — always identical regardless of email existence')
  })
  .describe('Forgot password response — uniform for security');

export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;

export const ResetPasswordRequestSchema = z
  .object({
    token: z.string().min(1).describe('Password reset token from email link'),
    newPassword: z.string().min(6).describe('New password (minimum 6 characters)')
  })
  .describe('Reset password request body');

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
