import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';

export default async function (fastify: FastifyInstance) {
  fastify.log.info('Connecting to MongoDB');

  await mongoose
    .connect(fastify.config.MONGO_URI)
    .then(() => {
      fastify.log.info('Successfully connected to MongoDB');
    })
    .catch((err) => {
      fastify.log.error('Failed to connect to MongoDB', err);
    });

  fastify.addHook('onClose', function () {
    fastify.log.info('Disconnecting from MongoDB');
    return mongoose.disconnect();
  });
}
