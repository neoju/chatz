import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import rateLimit from '@fastify/rate-limit';

import configEnv from '@/plugins/config.js';
import mongoose from '@/plugins/mongoose.js';
import providerZod from '@/plugins/provider-zod.js';
import redis from '@/plugins/redis.js';
import emailPlugin from '@/modules/email/email.plugin.js';

import authMiddleware from '@/middlewares/auth.js';

import authRouter from '@/modules/auth/auth.router.js';
import userRouter from '@/modules/user/user.router.js';

const server = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

await configEnv(server);
server.register(mongoose);
server.register(providerZod);
server.register(rateLimit, { max: 100, timeWindow: '1 minute' });
server.register(redis);
server.register(emailPlugin);

server.register(authRouter, { prefix: '/api' });
server.register(
  async function (app) {
    await app.register(authMiddleware);

    app.register(userRouter, { prefix: '/users' });
  },
  { prefix: '/api' }
);

server.get('/health', () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const port = Number(server.config.PORT);
const host = server.config.HOST;

server
  .listen({ port, host })
  .then(() => {
    server.log.info(`Backend listening on http://${host}:${port}`);
  })
  .catch((err) => {
    server.log.error(err);
    process.exit(1);
  });
