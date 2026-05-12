import { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import * as dto from '@chatz/dto';

import membershipService from './membership.service.js';

export default function membershipRouter(app: FastifyInstance) {
  const memService = membershipService(app);

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
}
