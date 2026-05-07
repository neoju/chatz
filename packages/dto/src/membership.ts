import { z } from 'zod/v4';
import { ConversationRole } from '@chatz/shared';

export const MemberResponseSchema = z
  .object({
    id: z.string().describe('Member ID'),
    userId: z.string().describe('User ID'),
    conversationId: z.string().describe('Conversation ID'),
    nickname: z.string().nullable().describe('Member nickname in this conversation'),
    role: z.enum([ConversationRole.ADMIN, ConversationRole.MEMBER]).describe('Member role'),
    pinned: z.boolean().describe('Whether conversation is pinned for this member'),
    muted: z.boolean().describe('Whether conversation is muted for this member'),
    unreadCount: z.number().describe('Unread message count'),
    lastReadMessageId: z.string().nullable().describe('Last read message ID'),
    lastReadAt: z.string().nullable().describe('Last read timestamp'),
    joinedAt: z.string().describe('Join timestamp'),
    createdAt: z.string().describe('Creation timestamp'),
    updatedAt: z.string().describe('Last update timestamp')
  })
  .describe('Conversation member response');

export type MemberResponse = z.infer<typeof MemberResponseSchema>;

export const UpdateMemberRequestSchema = z
  .object({
    role: z.enum([ConversationRole.ADMIN, ConversationRole.MEMBER]).describe('New member role')
  })
  .describe('Update member role request body');

export type UpdateMemberRequest = z.infer<typeof UpdateMemberRequestSchema>;

export const MemberNicknameRequestSchema = z
  .object({
    nickname: z.string().min(1).max(50).describe('New nickname')
  })
  .describe('Update nickname request body');

export type MemberNicknameRequest = z.infer<typeof MemberNicknameRequestSchema>;
