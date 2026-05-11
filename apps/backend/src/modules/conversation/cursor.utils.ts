export function encodeCursor<T extends Record<string, unknown>>(cursor: T): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

export function decodeCursor<T extends Record<string, unknown>>(cursor: string): T {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  return JSON.parse(decoded) as T;
}
