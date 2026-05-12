import { z } from 'zod/v4';

export const CursorPaginationQuerySchema = z
  .object({
    cursor: z.string().optional().describe('Pagination cursor (base64 encoded)'),
    limit: z.coerce.number().min(1).max(100).default(50).describe('Number of items to return')
  })
  .describe('Cursor pagination query parameters');

export type CursorPaginationQuery = z.infer<typeof CursorPaginationQuerySchema>;

export const CursorPaginationResponseSchema = z
  .object({
    items: z.array(z.unknown()).describe('Result items'),
    nextCursor: z.string().nullable().describe('Next page cursor (null if no more results)'),
  })
  .describe('Cursor pagination response');

export type CursorPaginationResponse = z.infer<typeof CursorPaginationResponseSchema>;
