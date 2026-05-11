import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { ConversationType, ConversationRole } from '@chatz/shared';
import { CreateConversationRequest, UpdateConversationRequest, ConversationResponse } from '@chatz/dto';

import { DEFAULT_PAGE_LIMIT } from '@/shared/constants.js';
import { LAST_MESSAGE_PREVIEW_MAX_LENGTH } from '@/shared/constants.js';
import { BadRequestException, ForbiddenException, NotFoundException } from '@/shared/errors.js';

import { Conversation, IConversation } from './conversation.schema.js';
import { ConversationMember } from './conversation-member.schema.js';
import { User } from '@/shared/schemas/user.schema.js';
import { encodeCursor, decodeCursor } from './cursor.utils.js';

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
      lastActivityAt: conversation.lastActivityAt.toISOString(),
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
            {
              $lookup: {
                from: 'conversations',
                localField: 'conversationId',
                foreignField: '_id',
                as: 'conversation'
              }
            },
            { $unwind: '$conversation' },
            {
              $match: {
                userId: new mongoose.Types.ObjectId(userId),
                'conversation.type': ConversationType.DM,
                'conversation.deletedAt': null
              }
            },
            {
              $lookup: {
                from: 'conversation_members',
                let: { convId: '$conversationId' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$conversationId', '$$convId'] } } },
                  { $match: { userId: new mongoose.Types.ObjectId(uniqueIds[0]) } }
                ],
                as: 'otherMembers'
              }
            },
            { $match: { otherMembers: { $ne: [] } } },
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

    async listConversations(userId: string, limit: number = DEFAULT_PAGE_LIMIT, cursor?: string) {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const pipeline: any[] = [
        { $match: { userId: userObjectId } },
        {
          $lookup: {
            from: 'conversations',
            localField: 'conversationId',
            foreignField: '_id',
            as: 'conversation'
          }
        },
        { $unwind: '$conversation' },
        { $match: { 'conversation.deletedAt': null } },
        {
          $addFields: {
            hasUnread: { $cond: [{ $gt: ['$unreadCount', 0] }, 1, 0] },
            activityAt: { $ifNull: ['$conversation.lastActivityAt', '$conversation.updatedAt'] }
          }
        }
      ];

      if (cursor) {
        const c = decodeCursor<{ pinned: boolean; hasUnread: number; lastActivityAt: string; _id: string }>(cursor);
        const lastActivityAt = new Date(c.lastActivityAt);
        const lastId = new mongoose.Types.ObjectId(c._id);

        pipeline.push({
          $match: {
            $or: [
              { pinned: { $lt: c.pinned } },
              { pinned: c.pinned, hasUnread: { $lt: c.hasUnread } },
              { pinned: c.pinned, hasUnread: c.hasUnread, activityAt: { $lt: lastActivityAt } },
              { pinned: c.pinned, hasUnread: c.hasUnread, activityAt: lastActivityAt, _id: { $lt: lastId } }
            ]
          }
        });
      }

      pipeline.push({
        $sort: {
          pinned: -1,
          hasUnread: -1,
          activityAt: -1,
          _id: -1
        }
      });

      pipeline.push({ $limit: limit + 1 });

      const memberships = await ConversationMember.aggregate(pipeline);

      const hasMore = memberships.length > limit;
      const items = memberships.slice(0, limit);

      let nextCursor: string | null = null;
      if (hasMore && items.length > 0) {
        const last = items[items.length - 1]!;
        nextCursor = encodeCursor({
          pinned: last.pinned,
          hasUnread: last.hasUnread,
          lastActivityAt: last.activityAt.toISOString(),
          _id: last._id.toString()
        });
      }

      const conversationIds = items.map((m) => m.conversationId);

      // Fetch member counts for the conversations
      const memberCounts = await ConversationMember.aggregate([
        { $match: { conversationId: { $in: conversationIds } } },
        { $group: { _id: '$conversationId', count: { $sum: 1 } } }
      ]);
      const memberCountMap = new Map(memberCounts.map((m) => [m._id.toString(), m.count]));

      // Fetch all members of these conversations to identify DM partners
      const allMembers = await ConversationMember.find({
        conversationId: { $in: conversationIds }
      }).lean();

      const dmConversationIds = items
        .filter((i) => i.conversation.type === ConversationType.DM)
        .map((i) => i.conversationId.toString());

      const otherMemberUserIds = new Set<string>();
      const conversationOtherMembers = new Map<string, { userId: string; nickname: string | null }>();

      for (const member of allMembers) {
        const convId = member.conversationId.toString();
        if (dmConversationIds.includes(convId) && member.userId.toString() !== userId) {
          otherMemberUserIds.add(member.userId.toString());
          conversationOtherMembers.set(convId, {
            userId: member.userId.toString(),
            nickname: member.nickname ?? null
          });
        }
      }

      // Identify users needed for last message sender info
      const lastMessageSenderIds = new Set<string>();
      for (const item of items) {
        if (item.conversation.lastMessage?.senderId) {
          lastMessageSenderIds.add(item.conversation.lastMessage.senderId.toString());
        }
      }

      const allUserIds = new Set([...otherMemberUserIds, ...lastMessageSenderIds]);

      const users = await User.find({
        _id: { $in: Array.from(allUserIds).map((id) => new mongoose.Types.ObjectId(id)) }
      }).lean();

      const userMap = new Map(users.map((u) => [u._id.toString(), { nickname: u.nickname, avatarUrl: u.avatarUrl }]));

      const results = items
        .map((m) => {
          const conv = m.conversation;
          const lastMsg = conv.lastMessage;

          const lastMessagePreview = lastMsg?.content
            ? lastMsg.content.length > LAST_MESSAGE_PREVIEW_MAX_LENGTH
              ? lastMsg.content.slice(0, LAST_MESSAGE_PREVIEW_MAX_LENGTH) + '...'
              : lastMsg.content
            : null;

          let displayName: string;
          let avatarUrl: string | null = null;
          if (conv.type === ConversationType.GROUP) {
            displayName = conv.name ?? 'Unnamed Group';
          } else {
            const otherMember = conversationOtherMembers.get(conv._id.toString());
            if (otherMember) {
              const otherUser = userMap.get(otherMember.userId);
              displayName = otherMember.nickname ?? otherUser?.nickname ?? 'Direct Message';
              avatarUrl = otherUser?.avatarUrl ?? null;
            } else {
              displayName = 'Direct Message';
            }
          }

          const lastMsgSenderId = lastMsg?.senderId?.toString();
          const lastMsgSenderUser = lastMsgSenderId ? userMap.get(lastMsgSenderId) : undefined;
          const lastMessage = lastMessagePreview
            ? {
              content: lastMessagePreview,
              sender: lastMsgSenderId
                ? {
                  id: lastMsgSenderId,
                  name: lastMsgSenderUser?.nickname ?? 'Unknown',
                  avatarUrl: lastMsgSenderUser?.avatarUrl ?? null
                }
                : null,
              createdAt: lastMsg?.sentAt?.toISOString() ?? conv.updatedAt.toISOString()
            }
            : null;

          return {
            id: conv._id.toString(),
            type: conv.type,
            name: conv.name ?? null,
            displayName,
            avatarUrl,
            createdAt: conv.createdAt.toISOString(),
            updatedAt: conv.updatedAt.toISOString(),
            lastActivityAt: m.activityAt.toISOString(),
            pinned: m.pinned,
            muted: m.muted,
            unreadCount: m.unreadCount,
            lastReadMessageId: m.lastReadMessageId?.toString() ?? null,
            memberCount: memberCountMap.get(m.conversationId.toString()) ?? 0,
            lastMessage
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      return {
        items: results,
        nextCursor,
        hasMore
      };
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
      conversation.lastActivityAt = new Date();
      await conversation.save();

      await ConversationMember.updateMany(
        { conversationId },
        { $set: { updatedAt: new Date() } }
      );

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
