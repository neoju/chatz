import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { HttpException } from '@/shared/errors.js';

function isFastifyError(error: unknown): error is FastifyError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as FastifyError).code === 'string' &&
    (error as FastifyError).code.startsWith('FST_ERR_')
  );
}

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error({ err: error }, 'Request error');

    if (error instanceof HttpException) {
      const statusCode = error.getStatus();
      const response = error.getResponse();

      return reply.status(statusCode).send(
        typeof response === 'string'
          ? { statusCode, message: response }
          : { statusCode, ...response }
      );
    }

    if (isFastifyError(error)) {
      const statusCode = error.statusCode ?? 500;

      if (error.validation) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
          details: error.validation
        });
      }

      return reply.status(statusCode).send({
        statusCode,
        error: error.name,
        message: error.message
      });
    }

    // MongoDB duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'A duplicate resource already exists'
      });
    }

    if (error instanceof Error) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error.message
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  });
}

export default fp(errorHandlerPlugin);
