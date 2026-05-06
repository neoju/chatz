import { FastifyInstance } from 'fastify';

import * as userService from './user.service.js';

export default function userRouter(app: FastifyInstance) {
  app.get('/me', (req) => {
    return userService.getUserProfile(req.user!.userId);
  });
}
