import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import * as dto from '@chatz/dto';

import { DEFAULT_PAGE_LIMIT } from '@/shared/constants.js';
import conversationService from './conversation.service.js';

export default function conversationRouter(app: FastifyInstance) {
  const convService = conversationService(app);

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
}
