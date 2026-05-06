import { FastifyInstance } from 'fastify';

import {
  LoginRequestSchema,
  RegisterRequestSchema,
  AuthResponseSchema,
  ForgotPasswordRequestSchema,
  ForgotPasswordResponseSchema,
  ResetPasswordRequestSchema,
  type LoginRequest,
  type RegisterRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest
} from '@chatz/dto';

import authService from './auth.service.js';
import passwordResetService from './password-reset.service.js';

export default function authRouter(app: FastifyInstance) {
  const service = authService(app);
  const passwordReset = passwordResetService(app);

  app.post<{ Body: LoginRequest }>(
    '/login',
    {
      schema: {
        body: LoginRequestSchema,
        response: {
          200: AuthResponseSchema
        }
      }
    },
    async (req, res) => {
      const { email, password } = req.body;
      const token = await service.login(email, password);

      res.code(200).send({ token });
    }
  );

  app.post<{ Body: RegisterRequest }>(
    '/register',
    {
      schema: {
        body: RegisterRequestSchema,
        response: {
          201: AuthResponseSchema
        }
      }
    },
    async (req, res) => {
      const token = await service.register(req.body);

      res.code(201).send({ token });
    }
  );

  app.post<{ Body: ForgotPasswordRequest }>(
    '/forgot-password',
    {
      schema: {
        body: ForgotPasswordRequestSchema,
        response: { 200: ForgotPasswordResponseSchema }
      }
    },
    async (_req, res) => {
      await passwordReset.handleForgotPassword(_req.body.email);

      return res
        .code(200)
        .send({ message: 'If your email is registered, you will receive a reset link' });
    }
  );

  app.post<{ Body: ResetPasswordRequest }>(
    '/reset-password',
    {
      schema: {
        body: ResetPasswordRequestSchema,
      }
    },
    async (req, res) => {
      const { token, newPassword } = req.body;

      await passwordReset.resetPassword(token, newPassword);

      return res.code(204).send();
    }
  );
}
