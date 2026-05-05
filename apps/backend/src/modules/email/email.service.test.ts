import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PASSWORD_RESET_JOB, type PasswordResetJobData } from '@/modules/email/email.queue.js';

interface QueueCall {
  name: typeof PASSWORD_RESET_JOB;
  data: PasswordResetJobData;
}

function createMockApp(): FastifyInstance & { queueCalls: QueueCall[] } {
  const queueCalls: QueueCall[] = [];
  const addMock = vi.fn(async (_name: typeof PASSWORD_RESET_JOB, _data: PasswordResetJobData) => {
    queueCalls.push({ name: _name, data: _data });
    return { id: 'test-job-id' };
  });
  return {
    queueCalls,
    emailQueue: {
      add: addMock
    }
  } as unknown as FastifyInstance & { queueCalls: QueueCall[]; addMock: Mock };
}

describe('emailService', () => {
  it('should export a factory function that returns sendPasswordResetEmail', async () => {
    const { default: emailServiceFactory } = await import('@/modules/email/email.service.js');
    expect(typeof emailServiceFactory).toBe('function');
  });
});

describe('sendPasswordResetEmail integration shape', () => {
  it('should enqueue a password reset email job with correct data', async () => {
    const { default: emailServiceFactory } = await import('@/modules/email/email.service.js');
    const app = createMockApp();
    const service = emailServiceFactory(app);

    await service.sendPasswordResetEmail(
      'user@example.com',
      'TestUser',
      'https://chatz.example.com/reset-password?token=test'
    );

    const addSpy = app.emailQueue.add as Mock;
    expect(addSpy).toHaveBeenCalledWith(PASSWORD_RESET_JOB, {
      to: 'user@example.com',
      username: 'TestUser',
      resetLink: 'https://chatz.example.com/reset-password?token=test'
    });
    expect(app.queueCalls).toHaveLength(1);
    expect(app.queueCalls[0]?.name).toBe(PASSWORD_RESET_JOB);
    expect(app.queueCalls[0]?.data.to).toBe('user@example.com');
  });
});
