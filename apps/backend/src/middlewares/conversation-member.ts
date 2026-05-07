import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { ConversationRole } from '@chatz/shared';

import { IConversationMember, ConversationMember } from '@/modules/conversation/conversation-member.schema.js';
import { IConversation, Conversation } from '@/modules/conversation/conversation.schema.js';

declare module 'fastify' {
  interface FastifyRequest {
    conversation?: IConversation & { id: string };
    membership?: IConversationMember & { id: string };
  }
}

function requireConversationMember(app: FastifyInstance) {
  app.addHook('preHandler', async function (request: FastifyRequest, reply: FastifyReply) {
    const conversationId = (request.params as Record<string, string>).id;

    if (!conversationId) {
      return reply.status(400).send({ error: 'Conversation ID is required' });
    }

    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const userId = request.user.userId;

    const [conversation, membership] = await Promise.all([
      Conversation.findOne({ _id: conversationId, deletedAt: null }),
      ConversationMember.findOne({
        conversationId,
        userId
      })
    ]);

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }

    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden: not a member of this conversation' });
    }

    const conversationObj = conversation.toObject();
    const membershipObj = membership.toObject();

    request.conversation = { ...conversationObj, id: conversation.id };
    request.membership = { ...membershipObj, id: membership.id };
  });
}

export function isAdmin(membership: IConversationMember & { id: string }): boolean {
  return membership.role === ConversationRole.ADMIN;
}

export function isMember(membership: IConversationMember & { id: string }): boolean {
  return membership.role === ConversationRole.MEMBER;
}

export default fp(requireConversationMember);
