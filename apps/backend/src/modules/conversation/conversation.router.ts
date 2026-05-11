import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import * as dto from '@chatz/dto';

import { DEFAULT_PAGE_LIMIT } from '@/shared/constants.js';

import conversationService from './conversation.service.js';
import messageService from './message.service.js';
import membershipService from './membership.service.js';
import invitationService from './invitation.service.js';
import readReceiptService from './read-receipt.service.js';


export default function conversationRouter(app: FastifyInstance) {
  const convService = conversationService(app);
  const msgService = messageService(app);
  const memService = membershipService(app);
  const invService = invitationService(app);
  const readService = readReceiptService(app);

  app.post<{ Body: dto.CreateConversationRequest }>(
    '/conversations',
    {
      schema: {
        body: dto.CreateConversationRequestSchema,
        response: { 201: dto.ConversationResponseSchema }
      }
    },
    async (req, res) => {
      const result = await convService.createConversation(req.body, req.user!.userId);
      return res.code(201).send(result);
    }
  );

  app.get<{ Querystring: dto.ListConversationsQuery }>(
    '/conversations',
    {
      schema: {
        querystring: dto.ListConversationsQuerySchema,
        response: { 200: dto.ListConversationsPaginatedResponseSchema }
      }
    },
    async (req) => {
      return convService.listConversations(
        req.user!.userId,
        req.query.limit ?? DEFAULT_PAGE_LIMIT,
        req.query.cursor
      );
    }
  );

  app.get<{ Params: { id: string } }>(
    '/conversations/:id',
    {
      schema: {
        response: { 200: dto.ConversationResponseSchema }
      }
    },
    async (req) => {
      return convService.getConversation(req.params.id, req.user!.userId);
    }
  );

  app.patch<{ Params: { id: string }; Body: dto.UpdateConversationRequest }>(
    '/conversations/:id',
    {
      schema: {
        body: dto.UpdateConversationRequestSchema,
        response: { 200: dto.ConversationResponseSchema }
      }
    },
    async (req) => {
      return convService.updateConversation(req.params.id, req.user!.userId, req.body);
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/conversations/:id',
    {
      schema: {
        response: { 204: z.void() }
      }
    },
    async (req, res) => {
      await convService.deleteConversation(req.params.id, req.user!.userId);
      return res.code(204).send();
    }
  );

  app.post<{ Body: dto.SendMessageRequest }>(
    '/messages',
    {
      schema: {
        body: dto.SendMessageRequestSchema,
        response: { 201: dto.MessageResponseSchema }
      }
    },
    async (req, res) => {
      const result = await msgService.sendMessage(req.body, req.user!.userId);
      return res.code(201).send(result);
    }
  );

  app.get<{ Querystring: dto.ListMessagesQuery }>(
    '/messages',
    {
      schema: {
        querystring: dto.ListMessagesQuerySchema,
        response: { 200: dto.ListMessagesResponseSchema }
      }
    },
    async (req) => {
      return msgService.listMessages(
        req.query.conversationId,
        req.user!.userId,
        req.query.limit ?? DEFAULT_PAGE_LIMIT,
        req.query.cursor
      );
    }
  );

  app.patch<{ Params: { id: string }; Body: dto.EditMessageRequest }>(
    '/messages/:id',
    {
      schema: {
        body: dto.EditMessageRequestSchema,
        response: { 200: dto.MessageResponseSchema }
      }
    },
    async (req) => {
      return msgService.editMessage(req.params.id, req.user!.userId, req.body);
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/messages/:id',
    {
      schema: {
        response: { 204: z.void() }
      }
    },
    async (req, res) => {
      await msgService.deleteMessage(req.params.id, req.user!.userId);
      return res.code(204).send();
    }
  );

  app.get<{ Querystring: dto.SearchMessagesQuery }>(
    '/messages/search',
    {
      schema: {
        querystring: dto.SearchMessagesQuerySchema,
        response: { 200: dto.SearchMessagesResponseSchema }
      }
    },
    async (req) => {
      return msgService.searchMessages(
        req.query.conversationId,
        req.user!.userId,
        req.query.query,
        req.query.limit ?? DEFAULT_PAGE_LIMIT,
        req.query.cursor
      );
    }
  );

  app.post<{ Params: { id: string } }>(
    '/conversations/:id/leave',
    {
      schema: {
        response: { 204: z.void() }
      }
    },
    async (req, res) => {
      await memService.leaveConversation(req.params.id, req.user!.userId);
      return res.code(204).send();
    }
  );

  app.post<{ Params: { id: string } }>(
    '/conversations/:id/pin',
    {
      schema: {
        response: { 200: dto.MemberResponseSchema }
      }
    },
    async (req) => {
      return memService.pinConversation(req.params.id, req.user!.userId, true);
    }
  );

  app.post<{ Params: { id: string } }>(
    '/conversations/:id/unpin',
    {
      schema: {
        response: { 200: dto.MemberResponseSchema }
      }
    },
    async (req) => {
      return memService.pinConversation(req.params.id, req.user!.userId, false);
    }
  );

  app.post<{ Params: { id: string } }>(
    '/conversations/:id/mute',
    {
      schema: {
        response: { 200: dto.MemberResponseSchema }
      }
    },
    async (req) => {
      return memService.muteConversation(req.params.id, req.user!.userId, true);
    }
  );

  app.post<{ Params: { id: string } }>(
    '/conversations/:id/unmute',
    {
      schema: {
        response: { 200: dto.MemberResponseSchema }
      }
    },
    async (req) => {
      return memService.muteConversation(req.params.id, req.user!.userId, false);
    }
  );

  app.post<{ Params: { id: string }; Body: dto.MemberNicknameRequest }>(
    '/conversations/:id/nickname',
    {
      schema: {
        body: dto.MemberNicknameRequestSchema,
        response: { 200: dto.MemberResponseSchema }
      }
    },
    async (req) => {
      return memService.updateNickname(req.params.id, req.user!.userId, req.body);
    }
  );

  app.post<{ Params: { id: string; userId: string }; Body: dto.UpdateMemberRequest }>(
    '/conversations/:id/members/:userId',
    {
      schema: {
        body: dto.UpdateMemberRequestSchema,
        response: { 200: dto.MemberResponseSchema }
      }
    },
    async (req) => {
      return memService.updateMemberRole(
        req.params.id,
        req.params.userId,
        req.user!.userId,
        req.body
      );
    }
  );

  app.post<{ Body: dto.CreateInviteRequest }>(
    '/invites',
    {
      schema: {
        body: dto.CreateInviteRequestSchema,
        response: { 201: dto.InviteResponseSchema }
      }
    },
    async (req, res) => {
      const result = await invService.createInvite(req.body, req.user!.userId);
      return res.code(201).send(result);
    }
  );

  app.get(
    '/invites',
    {
      schema: {
        response: { 200: z.array(dto.InviteResponseSchema) }
      }
    },
    async (req) => {
      return invService.listPendingInvites(req.user!.userId);
    }
  );

  app.post<{ Params: { id: string } }>(
    '/invites/:id/accept',
    {
      schema: {
        response: { 200: dto.AcceptInviteResponseSchema }
      }
    },
    async (req) => {
      return invService.acceptInvite(req.params.id, req.user!.userId);
    }
  );

  app.post<{ Params: { id: string } }>(
    '/invites/:id/decline',
    {
      schema: {
        response: { 204: z.void() }
      }
    },
    async (req, res) => {
      await invService.declineInvite(req.params.id, req.user!.userId);
      return res.code(204).send();
    }
  );

  app.post<{ Params: { id: string }; Body: dto.MarkReadRequest }>(
    '/conversations/:id/read',
    {
      schema: {
        body: dto.MarkReadRequestSchema,
        response: { 200: dto.MemberResponseSchema }
      }
    },
    async (req) => {
      return readService.markAsRead(req.params.id, req.user!.userId, req.body);
    }
  );

  app.get<{ Params: { id: string } }>(
    '/conversations/:id/unread',
    {
      schema: {
        response: { 200: dto.UnreadCountResponseSchema }
      }
    },
    async (req) => {
      return readService.getUnreadCount(req.params.id, req.user!.userId);
    }
  );

  app.get(
    '/conversations/unread-summary',
    {
      schema: {
        response: { 200: dto.UnreadSummaryResponseSchema }
      }
    },
    async (req) => {
      return readService.getUnreadSummary(req.user!.userId);
    }
  );
}
