import { z } from 'zod/v4';

export const LoginRequestSchema = z
  .object({
    email: z.email().describe('User email address'),
    password: z.string().max(100).describe('User password')
  })
  .describe('Login request body');

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z
  .object({
    email: z.email().describe('User email address'),
    password: z.string().min(6).describe('User password (minimum 6 characters)'),
    nickname: z.string().min(1).max(50).describe('User display name'),
    avatarUrl: z.url().optional().describe('Optional avatar image URL')
  })
  .describe('Registration request body');

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const AuthResponseSchema = z
  .object({
    token: z.string().describe('JWT authentication token')
  })
  .describe('Authentication response');

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
