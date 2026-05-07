import { z } from 'zod/v4';

export const MarkReadRequestSchema = z
  .object({
    lastReadMessageId: z.string().min(1).describe('ID of the message marked as read up to')
  })
  .describe('Mark as read request body');

export type MarkReadRequest = z.infer<typeof MarkReadRequestSchema>;

export const UnreadCountResponseSchema = z
  .object({
    conversationId: z.string().describe('Conversation ID'),
    unreadCount: z.number().describe('Number of unread messages')
  })
  .describe('Unread count response');

export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;

export const UnreadSummaryResponseSchema = z
  .object({
    totalUnread: z.number().describe('Total unread messages across all conversations'),
    conversations: z.array(
      z.object({
        conversationId: z.string().describe('Conversation ID'),
        unreadCount: z.number().describe('Unread count for this conversation'),
        muted: z.boolean().describe('Whether conversation is muted')
      })
    ).describe('Per-conversation unread breakdown')
  })
  .describe('Unread summary response');

export type UnreadSummaryResponse = z.infer<typeof UnreadSummaryResponseSchema>;
