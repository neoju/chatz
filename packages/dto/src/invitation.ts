import { z } from 'zod/v4';
import { InviteStatus } from '@chatz/shared';

export const CreateInviteRequestSchema = z
  .object({
    conversationId: z.string().min(1).describe('Group conversation ID'),
    inviteeId: z.string().min(1).describe('User ID to invite')
  })
  .describe('Create invitation request body');

export type CreateInviteRequest = z.infer<typeof CreateInviteRequestSchema>;

export const InviteResponseSchema = z
  .object({
    id: z.string().describe('Invite ID'),
    conversationId: z.string().describe('Conversation ID'),
    inviterId: z.string().describe('Inviter user ID'),
    inviteeId: z.string().describe('Invitee user ID'),
    status: z.enum([InviteStatus.PENDING, InviteStatus.ACCEPTED, InviteStatus.DECLINED]).describe('Invite status'),
    expiresAt: z.string().describe('Expiration timestamp'),
    conversationName: z.string().nullable().describe('Conversation name'),
    inviterNickname: z.string().nullable().describe('Inviter nickname'),
    createdAt: z.string().describe('Creation timestamp'),
    updatedAt: z.string().describe('Last update timestamp')
  })
  .describe('Invitation response');

export type InviteResponse = z.infer<typeof InviteResponseSchema>;

export const ListInvitesQuerySchema = z
  .object({
    status: z.enum([InviteStatus.PENDING]).default(InviteStatus.PENDING).describe('Filter by status')
  })
  .describe('List invites query parameters');

export type ListInvitesQuery = z.infer<typeof ListInvitesQuerySchema>;

export const AcceptInviteResponseSchema = z.object({
  success: z.boolean().describe('Whether the invite was accepted successfully')
}).describe('Accept invite response');

export type AcceptInviteResponse = z.infer<typeof AcceptInviteResponseSchema>;
