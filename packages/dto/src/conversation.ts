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
    lastActivityAt: z.string().describe('Last activity timestamp'),
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

export const ListConversationsQuerySchema = z
  .object({
    cursor: z.string().optional().describe('Pagination cursor (base64 encoded)'),
    limit: z.coerce.number().min(1).max(100).default(50).describe('Number of conversations to return')
  })
  .describe('List conversations query parameters');

export type ListConversationsQuery = z.infer<typeof ListConversationsQuerySchema>;

export const ListConversationsResponseSchema = z.array(
  z.object({
    id: z.string().describe('Conversation ID'),
    type: z.enum([ConversationType.DM, ConversationType.GROUP]).describe('Conversation type'),
    name: z.string().nullable().describe('Conversation name (null for DM)'),
    displayName: z.string().describe('Display name for the conversation (group name or other participant name for DM)'),
    avatarUrl: z.string().nullable().describe('Avatar URL for the conversation (group avatar or other participant avatar for DM)'),
    lastActivityAt: z.string().describe('Last activity timestamp'),
    createdAt: z.string().describe('Creation timestamp'),
    updatedAt: z.string().describe('Last update timestamp'),
    pinned: z.boolean().describe('Whether pinned for current user'),
    muted: z.boolean().describe('Whether muted for current user'),
    unreadCount: z.number().describe('Unread message count for current user'),
    lastReadMessageId: z.string().nullable().describe('Last read message ID'),
    memberCount: z.number().describe('Total number of members'),
    lastMessage: z.object({
      content: z.string().nullable().describe('Last message content preview (truncated)'),
      sender: z.object({
        id: z.string().describe('Sender user ID'),
        name: z.string().describe('Sender display name'),
        avatarUrl: z.string().nullable().describe('Sender avatar URL')
      }).nullable().describe('Last message sender info'),
      createdAt: z.string().describe('Last message creation timestamp')
    }).nullable().describe('Last message preview with sender info')
  })
).describe('List conversations response');

export type ListConversationsResponse = z.infer<typeof ListConversationsResponseSchema>;

export const ListConversationsPaginatedResponseSchema = z.object({
  items: ListConversationsResponseSchema,
  nextCursor: z.string().nullable().describe('Next page cursor (null if no more results)')
}).describe('List conversations paginated response');

export type ListConversationsPaginatedResponse = z.infer<typeof ListConversationsPaginatedResponseSchema>;
