import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { ConversationType, ConversationRole } from '@chatz/shared';
import { CreateConversationRequest, UpdateConversationRequest, ConversationResponse } from '@chatz/dto';

import { Conversation, IConversation } from './conversation.schema.js';
import { ConversationMember } from './conversation-member.schema.js';
import { BadRequestException, ForbiddenException, NotFoundException } from '@/shared/errors.js';

export default function conversationService(_app: FastifyInstance) {
  async function mapToResponse(
    conversation: IConversation & { id: string },
    userId: string
  ): Promise<ConversationResponse> {
    const members = await ConversationMember.find({
      conversationId: conversation.id
    }).lean();

    const membership = members.find((m) => m.userId.toString() === userId);

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name ?? null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      pinned: membership?.pinned ?? false,
      muted: membership?.muted ?? false,
      unreadCount: membership?.unreadCount ?? 0,
      lastReadMessageId: membership?.lastReadMessageId?.toString() ?? null,
      members: members.map((m) => ({
        id: m._id.toString(),
        userId: m.userId.toString(),
        nickname: m.nickname ?? null,
        role: m.role,
        joinedAt: m.joinedAt.toISOString()
      }))
    };
  }

  return {
    async createConversation(params: CreateConversationRequest, userId: string) {
      const allParticipantIds = [userId, ...params.participantIds];
      const uniqueIds = [...new Set(allParticipantIds)];

      if (params.participantIds.length < 1) {
        throw new BadRequestException('At least one participant is required');
      }

      if (params.type === ConversationType.GROUP && !params.name) {
        throw new BadRequestException('Group conversations require a name');
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        if (params.type === ConversationType.DM) {
          if (params.participantIds.length !== 1) {
            throw new BadRequestException('DM conversations require exactly one other participant');
          }

          const existingDm = await ConversationMember.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
              $lookup: {
                from: 'conversationmembers',
                let: { convId: '$conversationId' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$conversationId', '$$convId'] } } },
                  { $match: { userId: new mongoose.Types.ObjectId(uniqueIds[0]) } }
                ],
                as: 'otherMembers'
              }
            },
            { $match: { otherMembers: { $ne: [] } } },
            {
              $lookup: {
                from: 'conversations',
                localField: 'conversationId',
                foreignField: '_id',
                as: 'conversation'
              }
            },
            { $match: { 'conversation.type': ConversationType.DM, 'conversation.deletedAt': null } },
            { $limit: 1 }
          ]).session(session);

          if (existingDm.length > 0) {
            const dmResult = existingDm[0] as { conversationId: string };
            const conv = await Conversation.findById(dmResult.conversationId).session(session);

            if (conv) {
              await session.abortTransaction();
              return mapToResponse({ ...conv.toObject(), id: conv.id }, userId);
            }
          }
        }

        const conversation = new Conversation({
          type: params.type,
          name: params.type === ConversationType.GROUP ? params.name : null
        });

        await conversation.save({ session });

        const memberDocs = uniqueIds.map((pid) => ({
          userId: new mongoose.Types.ObjectId(pid),
          conversationId: conversation._id,
          role: pid === userId ? ConversationRole.ADMIN : ConversationRole.MEMBER,
          joinedAt: new Date()
        }));

        await ConversationMember.insertMany(memberDocs, { session });

        await session.commitTransaction();

        return mapToResponse({ ...conversation.toObject(), id: conversation.id }, userId);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        void session.endSession();
      }
    },

    async listConversations(userId: string, limit: number = 50, _cursor?: string) {
      const memberships = await ConversationMember.find({
        userId
      })
        .sort({ pinned: -1, updatedAt: -1 })
        .limit(limit)
        .lean();

      const conversationIds = memberships.map((m) => m.conversationId);

      const conversations = await Conversation.find({
        _id: { $in: conversationIds },
        deletedAt: null
      }).lean();

      const conversationMap = new Map(conversations.map((c) => [c._id.toString(), c]));

      const results = memberships
        .map((m) => {
          const conv = conversationMap.get(m.conversationId.toString());
          if (!conv) return null;

          return {
            id: conv._id.toString(),
            type: conv.type,
            name: conv.name ?? null,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: conv.updatedAt.toISOString(),
            pinned: m.pinned,
            muted: m.muted,
            unreadCount: m.unreadCount,
            lastReadMessageId: m.lastReadMessageId?.toString() ?? null
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      return results;
    },

    async getConversation(conversationId: string, userId: string) {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        deletedAt: null
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new ForbiddenException('Not a member of this conversation');
      }

      return mapToResponse({ ...conversation.toObject(), id: conversation.id }, userId);
    },

    async updateConversation(
      conversationId: string,
      userId: string,
      params: UpdateConversationRequest
    ) {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new ForbiddenException('Not a member of this conversation');
      }

      if (membership.role !== ConversationRole.ADMIN) {
        throw new ForbiddenException('Only admins can update conversation');
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        deletedAt: null
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type === ConversationType.DM) {
        throw new BadRequestException('DM conversations cannot be updated');
      }

      conversation.name = params.name;
      await conversation.save();

      return mapToResponse({ ...conversation.toObject(), id: conversation.id }, userId);
    },

    async deleteConversation(conversationId: string, userId: string) {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new ForbiddenException('Not a member of this conversation');
      }

      if (membership.role !== ConversationRole.ADMIN) {
        throw new ForbiddenException('Only admins can delete conversation');
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        deletedAt: null
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type === ConversationType.DM) {
        throw new BadRequestException('DM conversations cannot be deleted');
      }

      conversation.deletedAt = new Date();
      await conversation.save();
    }
  };
}
