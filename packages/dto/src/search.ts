import { z } from 'zod/v4';

export const SearchMessagesQuerySchema = z
  .object({
    conversationId: z.string().min(1).describe('Conversation ID to search within'),
    query: z.string().min(1).max(200).describe('Search query text'),
    cursor: z.string().optional().describe('Pagination cursor'),
    limit: z.coerce.number().min(1).max(100).default(20).describe('Number of results to return')
  })
  .describe('Search messages query parameters');

export type SearchMessagesQuery = z.infer<typeof SearchMessagesQuerySchema>;

export const SearchMessagesResponseSchema = z
  .object({
    results: z.array(
      z.object({
        id: z.string().describe('Message ID'),
        content: z.string().describe('Message content'),
        senderId: z.string().describe('Sender user ID'),
        sentAt: z.string().describe('Message sent timestamp'),
        score: z.number().describe('Relevance score')
      })
    ).describe('Search results'),
    total: z.number().describe('Total matching results'),
    nextCursor: z.string().nullable().describe('Next page cursor')
  })
  .describe('Search messages response');

export type SearchMessagesResponse = z.infer<typeof SearchMessagesResponseSchema>;
