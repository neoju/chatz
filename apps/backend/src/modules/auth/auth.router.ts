import { FastifyInstance } from 'fastify';

import {
  LoginRequestSchema,
  RegisterRequestSchema,
  AuthResponseSchema,
  type LoginRequest,
  type RegisterRequest
} from '@chatz/dto';

import authService from './auth.service.js';

export default function authRouter(app: FastifyInstance) {
  const service = authService(app);

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
}
