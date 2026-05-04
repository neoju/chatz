import Fastify from 'fastify';

import authRouter from './modules/auth/auth.router.js';
import userRouter from './modules/user/user.router.js';

const server = Fastify({ logger: true });

server.get('/health', () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

server.register(authRouter);
server.register(userRouter, { prefix: '/users' });

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

server
  .listen({ port, host })
  .then(() => {
    server.log.info(`Backend listening on http://${host}:${port}`);
  })
  .catch((err) => {
    server.log.error(err);
    process.exit(1);
  });
