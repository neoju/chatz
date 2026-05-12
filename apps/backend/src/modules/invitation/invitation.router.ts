import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import * as dto from '@chatz/dto';

import invitationService from './invitation.service.js';

export default function invitationRouter(app: FastifyInstance) {
  const invService = invitationService(app);

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
}
