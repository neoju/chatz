import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  type ZodTypeProvider
} from 'fastify-type-provider-zod';
import type { FastifyInstance } from 'fastify';

async function providerZod(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Chatz API',
        description: 'Real-time chat and video calling application API',
        version: '1.0.0'
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject
  });
  await fastify.register(fastifySwaggerUI, { routePrefix: '/api/docs' });
}

export default fp(providerZod);

export type { ZodTypeProvider };
export { jsonSchemaTransform, jsonSchemaTransformObject };
