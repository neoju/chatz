import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

server.get('/', async () => {
  return { message: 'chatz backend is running' };
});

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
