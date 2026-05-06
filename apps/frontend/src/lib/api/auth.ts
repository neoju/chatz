import { api } from './api-client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@chatz/dto';
import type { ForgotPasswordResponse, ResetPasswordRequest } from '@chatz/dto';

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/login', data),

  register: (data: RegisterRequest) => api.post<AuthResponse>('/register', data),

  forgotPassword: (email: string) =>
    api.post<ForgotPasswordResponse>('/forgot-password', { email }),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<void>('/reset-password', data)
};
