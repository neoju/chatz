import { render } from '@react-email/render';
import { PasswordResetEmail } from '@chatz/email-template';
import { UnrecoverableError, Worker } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';
import {
  EMAIL_QUEUE,
  PASSWORD_RESET_JOB,
  createDlqQueue,
  type PasswordResetJobData
} from './email.queue.js';
import { SendError, type EmailSender } from './types.js';

export function createEmailWorker(
  redis: Redis,
  sender: EmailSender,
  app: FastifyInstance
): Worker<PasswordResetJobData, void, typeof PASSWORD_RESET_JOB> {
  const dlq = createDlqQueue(redis);

  const worker = new Worker<PasswordResetJobData, void, typeof PASSWORD_RESET_JOB>(
    EMAIL_QUEUE,
    async (job) => {
      if (job.name !== PASSWORD_RESET_JOB) {
        throw new UnrecoverableError(`Unsupported email job: ${String(job.name)}`);
      }

      app.log.info({ jobId: job.id, jobName: job.name, to: job.data.to }, 'Processing email job');

      const expiresInMinutes = Number(app.config.PWDRS_TTL) / 60;

      const template = PasswordResetEmail({
        username: job.data.username,
        resetLink: job.data.resetLink,
        expiresInMinutes
      });

      const [html, text] = await Promise.all([
        render(template),
        render(template, { plainText: true })
      ]);

      try {
        await sender.send({
          to: job.data.to,
          from: `"${app.config.EMAIL_FROM_NAME}" <${app.config.EMAIL_FROM_ADDRESS}>`,
          subject: 'Reset your Chatz password',
          html,
          text
        });

        app.log.info({ jobId: job.id, jobName: job.name, to: job.data.to }, 'Email job completed');
      } catch (error: unknown) {
        if (error instanceof SendError && !error.retriable) {
          throw new UnrecoverableError(error.message);
        }

        throw error;
      }
    },
    { connection: redis, concurrency: 10 }
  );

  worker.on('failed', (job, error) => {
    if (!job) {
      app.log.error({ error }, 'Email worker failed without job context');
      return;
    }

    const failedReason = error.message || 'Email job failed';
    const shouldMoveToDlq =
      error instanceof UnrecoverableError || job.attemptsMade >= (job.opts.attempts ?? 1);

    if (!shouldMoveToDlq) {
      app.log.error(
        {
          jobId: job.id,
          jobName: job.name,
          attemptsMade: job.attemptsMade,
          attempts: job.opts.attempts,
          failedReason
        },
        'Email job failed and will be retried'
      );
      return;
    }

    dlq
      .add(job.name, {
        ...job.data,
        originalJobId: job.id!,
        failedReason
      })
      .then((res) => {
        app.log.error({ jobId: job.id, data: res.data }, 'Email job moved to DLQ');
      })
      .catch((dlqError: unknown) => {
        app.log.error({ jobId: job.id, error: dlqError }, 'Failed to move email job to DLQ');
      });
  });

  worker.on('error', (error) => {
    app.log.error({ error }, 'Email worker error');
  });

  const closeWorker = worker.close.bind(worker);
  worker.close = async (force?: boolean): Promise<void> => {
    await closeWorker(force);
    await dlq.close();
  };

  return worker;
}
