import { z } from 'zod/v4';
import { RegisterRequestSchema, ResetPasswordRequestSchema } from '@chatz/dto';

export function createRegisterSchema() {
  return RegisterRequestSchema.extend({
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });
}

export function createResetPasswordSchema() {
  return ResetPasswordRequestSchema.extend({
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });
}
