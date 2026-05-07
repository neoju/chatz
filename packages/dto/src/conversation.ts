import { z } from 'zod/v4';
import { ConversationType } from '@chatz/shared';

export const CreateConversationRequestSchema = z
  .object({
    type: z.enum([ConversationType.DM, ConversationType.GROUP]).describe('Conversation type (dm or group)'),
    name: z.string().min(1).max(100).optional().describe('Conversation name (required for group)'),
    participantIds: z.array(z.string().min(1)).min(1).describe('Participant user IDs')
  })
  .describe('Create conversation request body');

export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;

export const ConversationResponseSchema = z
  .object({
    id: z.string().describe('Conversation ID'),
    type: z.enum([ConversationType.DM, ConversationType.GROUP]).describe('Conversation type'),
    name: z.string().nullable().describe('Conversation name (null for DM)'),
    createdAt: z.string().describe('Creation timestamp'),
    updatedAt: z.string().describe('Last update timestamp'),
    pinned: z.boolean().describe('Whether pinned for current user'),
    muted: z.boolean().describe('Whether muted for current user'),
    unreadCount: z.number().describe('Unread message count for current user'),
    lastReadMessageId: z.string().nullable().describe('Last read message ID'),
    members: z.array(
      z.object({
        id: z.string().describe('Member ID'),
        userId: z.string().describe('User ID'),
        nickname: z.string().nullable().describe('Member nickname'),
        role: z.enum(['admin', 'member']).describe('Member role'),
        joinedAt: z.string().describe('Join timestamp')
      })
    ).describe('Conversation members')
  })
  .describe('Conversation response');

export type ConversationResponse = z.infer<typeof ConversationResponseSchema>;

export const UpdateConversationRequestSchema = z
  .object({
    name: z.string().min(1).max(100).describe('New conversation name')
  })
  .describe('Update conversation request body');

export type UpdateConversationRequest = z.infer<typeof UpdateConversationRequestSchema>;
