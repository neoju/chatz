import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { Queue } from 'bullmq';

import emailService from './email.service.js';
import { createEmailQueue, type PasswordResetJobData } from './email.queue.js';
import { createEmailWorker } from './email.worker.js';
import { createSmtpSender } from './smtp.sender.js';

async function emailPlugin(app: FastifyInstance) {
  const queue = createEmailQueue(app.redis);
  const sender = createSmtpSender({
    host: app.config.SMTP_HOST,
    port: Number(app.config.SMTP_PORT),
    user: app.config.SMTP_USER,
    pass: app.config.SMTP_PASS,
    secure: app.config.SMTP_SECURE === 'true'
  });

  const worker = createEmailWorker(app.redis, sender, app);
  const service = emailService(app);

  app.decorate('emailQueue', queue);
  app.decorate('emailService', service);

  app.addHook('onClose', async () => {
    await worker.close();
    await queue.close();
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    emailQueue: Queue<PasswordResetJobData>;
    emailService: ReturnType<typeof emailService>;
  }
}

export default fp(emailPlugin);
