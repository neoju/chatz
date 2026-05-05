import { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: string;
      MONGO_URI: string;
      JWT_SECRET: string;
      HOST: string;
      REDIS_URL: string;
      FRONTEND_URL: string;
      EMAIL_FROM_NAME: string;
      EMAIL_FROM_ADDRESS: string;
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      SMTP_SECURE: string;

      /**
       * PWDRS_ prefix stands for "Password Reset"
       */
      PWDRS_TTL: string;
      PWDRS_RATE_LIMIT_PER_EMAIL: string;
      PWDRS_RATE_LIMIT_COOLDOWN_SEC: string;
    };
  }
}

const schema = {
  type: 'object' as const,
  required: [
    'MONGO_URI',
    'JWT_SECRET',
    'REDIS_URL',
    'FRONTEND_URL',
    'EMAIL_FROM_ADDRESS',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS'
  ],
  properties: {
    PORT: { type: 'string', default: 3000 },
    HOST: { type: 'string', default: '0.0.0.0' },
    MONGO_URI: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    REDIS_URL: { type: 'string' },
    FRONTEND_URL: { type: 'string' },
    EMAIL_FROM_NAME: { type: 'string', default: 'Chatz' },
    EMAIL_FROM_ADDRESS: { type: 'string' },
    SMTP_HOST: { type: 'string' },
    SMTP_PORT: { type: 'string', default: '587' },
    SMTP_USER: { type: 'string' },
    SMTP_PASS: { type: 'string' },
    SMTP_SECURE: { type: 'string', default: 'false' },
    PWDRS_TTL: { type: 'string', default: '900' },
    PWDRS_RATE_LIMIT_PER_EMAIL: { type: 'string', default: '3' },
    PWDRS_RATE_LIMIT_COOLDOWN_SEC: { type: 'string', default: '3600' }
  }
};

export default async function (fastify: FastifyInstance) {
  return fastify.register(fastifyEnv, { schema, dotenv: true });
}
