export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  messageId: string;
}

export class SendError extends Error {
  readonly retriable: boolean;

  constructor(message: string, retriable: boolean) {
    super(message);
    this.name = 'SendError';
    this.retriable = retriable;
  }
}

export interface EmailSender {
  send(msg: EmailMessage): Promise<SendResult>;
}
