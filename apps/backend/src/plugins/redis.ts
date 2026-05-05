import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

async function redisPlugin(app: FastifyInstance) {
  const redis = new Redis(app.config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null
  });

  app.decorate('redis', redis);

  app.log.info('Connecting to Redis');
  await redis.connect();
  app.log.info('Connected to Redis');

  app.addHook('onClose', function () {
    app.log.info('Disconnecting from Redis');
    return redis.quit();
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(redisPlugin);
