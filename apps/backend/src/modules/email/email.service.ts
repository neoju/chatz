import { FastifyInstance } from 'fastify';
import { PASSWORD_RESET_JOB } from './email.queue.js';

export default (app: FastifyInstance) => ({
  async sendPasswordResetEmail(to: string, username: string, resetLink: string): Promise<void> {
    await app.emailQueue.add(PASSWORD_RESET_JOB, { to, username, resetLink });
  }
});
