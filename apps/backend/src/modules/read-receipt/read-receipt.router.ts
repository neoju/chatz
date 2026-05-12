import { FastifyInstance } from 'fastify';
import * as dto from '@chatz/dto';

import readReceiptService from './read-receipt.service.js';

export default function readReceiptRouter(app: FastifyInstance) {
  const readService = readReceiptService(app);

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
