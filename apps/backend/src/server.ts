import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import configEnv from '@/plugins/config.js';
import mongoose from '@/plugins/mongoose.js';
import providerZod from '@/plugins/provider-zod.js';
import redis from '@/plugins/redis.js';
import emailPlugin from '@/modules/email/email.plugin.js';
import errorHandler from '@/plugins/error-handler.js';

import authMiddleware from '@/middlewares/auth.js';
import authRouter from '@/modules/auth/auth.router.js';
import userRouter from '@/modules/user/user.router.js';
import conversationRouter from '@/modules/conversation/conversation.router.js';
import messageRouter from '@/modules/message/message.router.js';
import membershipRouter from '@/modules/membership/membership.router.js';
import invitationRouter from '@/modules/invitation/invitation.router.js';
import readReceiptRouter from '@/modules/read-receipt/read-receipt.router.js';

const server = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

await configEnv(server);
await server.register(cors, {
  origin: true,
  credentials: true
});
await server.register(redis);
server.register(mongoose);
server.register(providerZod);
server.register(emailPlugin);
server.register(rateLimit, { max: 100, timeWindow: '1 minute' });
server.register(errorHandler);

server.register(authRouter, { prefix: '/api/v1' });
server.register(
  async function (app) {
    await app.register(authMiddleware);

    app.register(userRouter);
    app.register(conversationRouter);
    app.register(messageRouter);
    app.register(membershipRouter);
    app.register(invitationRouter);
    app.register(readReceiptRouter);
  },
  { prefix: '/api/v1' }
);

server.get('/health', () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

server
  .listen({ port: Number(server.config.PORT), host: server.config.HOST })
  .catch((err) => {
    server.log.error(err);
    process.exit(1);
  });
