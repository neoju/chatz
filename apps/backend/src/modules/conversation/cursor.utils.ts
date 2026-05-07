export interface MessageCursor {
  sentAt: string;
  _id: string;
}

export function encodeCursor(sentAt: Date, _id: string): string {
  const cursor: MessageCursor = {
    sentAt: sentAt.toISOString(),
    _id
  };
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

export function decodeCursor(cursor: string): MessageCursor {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  return JSON.parse(decoded) as MessageCursor;
}
