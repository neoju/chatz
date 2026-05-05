import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';

export default async function (app: FastifyInstance) {
  app.log.info('Connecting to MongoDB');
  await mongoose.connect(app.config.MONGO_URI);
  app.log.info('Successfully connected to MongoDB');

  app.addHook('onClose', function () {
    app.log.info('Disconnecting from MongoDB');

    return mongoose.disconnect();
  });
}
