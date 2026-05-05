import { describe, it, expect } from 'vitest';

import { SendError } from '@/modules/email/types.js';
import { createSmtpSender } from '@/modules/email/smtp.sender.js';

describe('SendError', () => {
  it('should be an instance of Error', () => {
    const err = new SendError('test', false);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SendError);
  });

  it('should have retriable property', () => {
    const retriable = new SendError('test', true);
    expect(retriable.retriable).toBe(true);
    const terminal = new SendError('test', false);
    expect(terminal.retriable).toBe(false);
  });

  it('should have correct name', () => {
    const err = new SendError('test', false);
    expect(err.name).toBe('SendError');
  });
});

describe('createSmtpSender', () => {
  it('should return an object with a send method', () => {
    const sender = createSmtpSender({
      host: 'localhost',
      port: 1025,
      user: 'test',
      pass: 'test',
      secure: false
    });
    expect(sender).toHaveProperty('send');
    expect(typeof sender.send).toBe('function');
  });
});
