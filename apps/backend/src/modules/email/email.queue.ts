import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

export const EMAIL_QUEUE = 'email';
export const EMAIL_DLQ = 'email-dlq';
export const PASSWORD_RESET_JOB = 'password_reset_email';

export interface PasswordResetJobData {
  to: string;
  username: string;
  resetLink: string;
}

export interface DlqJobData extends PasswordResetJobData {
  originalJobId: string;
  failedReason: string;
}

export function createEmailQueue(
  redis: Redis,
  attempts: number,
  backoffDelay: number
): Queue<PasswordResetJobData, void, typeof PASSWORD_RESET_JOB> {
  return new Queue<PasswordResetJobData, void, typeof PASSWORD_RESET_JOB>(EMAIL_QUEUE, {
    connection: redis,
    defaultJobOptions: {
      attempts,
      backoff: { type: 'exponential', delay: backoffDelay }
    }
  });
}

export function createDlqQueue(redis: Redis): Queue<DlqJobData> {
  return new Queue<DlqJobData>(EMAIL_DLQ, { connection: redis });
}
