import { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: string;
      MONGO_URI: string;
      JWT_SECRET: string;
      HOST: string;
    };
  }
}

const schema = {
  type: 'object',
  required: ['MONGO_URI', 'JWT_SECRET'],
  properties: {
    PORT: { type: 'string', default: 3000 },
    HOST: { type: 'string', default: '0.0.0.0' },
    MONGO_URI: { type: 'string' },
    JWT_SECRET: { type: 'string' }
  }
};

export default async function (fastify: FastifyInstance) {
  return fastify.register(fastifyEnv, { schema, dotenv: true });
}
