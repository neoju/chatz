import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import * as dto from '@chatz/dto';

import { DEFAULT_PAGE_LIMIT } from '@/shared/constants.js';
import messageService from './message.service.js';

export default function messageRouter(app: FastifyInstance) {
  const msgService = messageService(app);

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
}
