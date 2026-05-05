import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';

import { JWTPayload } from '@/shared/types.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

function authMiddleware(app: FastifyInstance) {
  app.addHook('preHandler', async function (request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, app.config.JWT_SECRET) as JWTPayload;
      request.user = decoded;
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}

export default fp(authMiddleware);
