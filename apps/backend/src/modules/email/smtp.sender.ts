import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { EmailSender, EmailMessage, SendResult } from './types.js';
import { SendError } from './types.js';

const RETRIABLE_CODES = new Set([421, 450, 451, 452]);
const RETRIABLE_STRING_CODES = new Set(['ECONNECTION', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED']);

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

interface NodemailerError {
  code?: string | number;
  responseCode?: number;
  message?: string;
}

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
        const nmErr = err as NodemailerError;
        const smtpCode =
          typeof nmErr.responseCode === 'number'
            ? nmErr.responseCode
            : typeof nmErr.code === 'number'
              ? nmErr.code
              : undefined;
        const stringCode = typeof nmErr.code === 'string' ? nmErr.code : undefined;
        const retriable =
          (smtpCode !== undefined && RETRIABLE_CODES.has(smtpCode)) ||
          (stringCode !== undefined && RETRIABLE_STRING_CODES.has(stringCode));
        throw new SendError(err instanceof Error ? err.message : 'SMTP send failed', retriable);
      }
    }
  };
}
