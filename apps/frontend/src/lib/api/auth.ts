import { api } from "./api-client";
import type { LoginRequest, RegisterRequest, AuthResponse } from "@chatz/dto";
import type { ForgotPasswordResponse, ResetPasswordRequest } from "@chatz/dto";

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>("/v1/login", data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>("/v1/register", data),

  forgotPassword: (email: string) =>
    api.post<ForgotPasswordResponse>("/v1/forgot-password", { email }),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<void>("/v1/reset-password", data),
};
