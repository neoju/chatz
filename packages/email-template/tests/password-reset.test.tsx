import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';

import { PasswordResetEmail } from '../emails/password-reset.js';

describe('PasswordResetEmail', () => {
  const props = {
    username: 'TestUser',
    resetLink: 'https://chatz.example.com/reset-password?token=abc123',
    expiresInMinutes: 15
  };

  it('renders valid HTML', async () => {
    const html = await render(PasswordResetEmail(props));

    expect(html).toContain('TestUser');
    expect(html).toContain('reset-password?token=abc123');
    expect(html).toContain('15');
    expect(html).toContain('Reset your password');
    expect(html).toMatch(/<html[\s>]/i);
  });

  it('renders valid plain text', async () => {
    const text = await render(PasswordResetEmail(props), { plainText: true });

    expect(text).toContain('TestUser');
    expect(text).toContain('reset-password?token=abc123');
    expect(text).toContain('15');
    expect(text).not.toContain('<html>');
    expect(text).not.toContain('<div>');
  });

  it('includes the reset link as a clickable element', async () => {
    const html = await render(PasswordResetEmail(props));

    expect(html).toContain('href="https://chatz.example.com/reset-password?token=abc123"');
  });

  it('includes expiration notice', async () => {
    const html = await render(PasswordResetEmail(props));

    expect(html).toContain('15');
    expect(html).toMatch(/expires in.*minutes/);
  });

  it('includes "ignore this email" safety text', async () => {
    const html = await render(PasswordResetEmail(props));

    expect(html).toContain('did not request this');
  });
});
