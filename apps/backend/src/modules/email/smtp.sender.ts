import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { EmailSender, EmailMessage, SendResult } from './types.js';
import { SendError } from './types.js';

/** SMTP error codes that indicate transient failures — safe to retry */
const RETRIABLE_CODES = new Set([421, 450, 451, 452, 500]);

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

/**
 * Creates an EmailSender backed by nodemailer SMTP with connection pooling.
 * Maps SMTP error codes to retriable/terminal SendError.
 */
export function createSmtpSender(config: SmtpConfig): EmailSender {
  const transporter: Transporter = nodemailer.createTransport({
    pool: true,
    host: config.host,
    port: config.port,
    auth: { user: config.user, pass: config.pass },
    secure: config.secure
  });

  return {
    async send(msg: EmailMessage): Promise<SendResult> {
      try {
        interface SendMailResult {
          messageId: string;
        }
        const result = (await transporter.sendMail({
          from: msg.from,
          to: msg.to,
          subject: msg.subject,
          html: msg.html,
          text: msg.text
        })) as SendMailResult;
        return { messageId: result.messageId };
      } catch (err: unknown) {
        const code = (err as { code?: number }).code;
        const retriable = typeof code === 'number' && RETRIABLE_CODES.has(code);
        throw new SendError(err instanceof Error ? err.message : 'SMTP send failed', retriable);
      }
    }
  };
}
