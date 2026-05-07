import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { MarkReadRequest, UnreadCountResponse, UnreadSummaryResponse } from '@chatz/dto';

import { ConversationMember } from './conversation-member.schema.js';
import { Message } from './message.schema.js';
import { NotFoundException, ForbiddenException } from '@/shared/errors.js';

export default function readReceiptService(_app: FastifyInstance) {
  return {
    async markAsRead(conversationId: string, userId: string, params: MarkReadRequest) {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new NotFoundException('Not a member of this conversation');
      }

      const message = await Message.findById(params.lastReadMessageId);
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      membership.lastReadMessageId = new mongoose.Types.ObjectId(params.lastReadMessageId);
      membership.lastReadAt = new Date();

      const unreadCount = await Message.countDocuments({
        conversationId,
        deletedAt: null,
        sentAt: { $gt: message.sentAt }
      });

      membership.unreadCount = unreadCount;
      await membership.save();

      return {
        id: membership.id,
        userId: membership.userId.toString(),
        conversationId: membership.conversationId.toString(),
        nickname: membership.nickname ?? null,
        role: membership.role,
        pinned: membership.pinned,
        muted: membership.muted,
        unreadCount: membership.unreadCount,
        lastReadMessageId: membership.lastReadMessageId?.toString() ?? null,
        lastReadAt: membership.lastReadAt?.toISOString() ?? null,
        joinedAt: membership.joinedAt.toISOString(),
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString()
      };
    },

    async getUnreadCount(conversationId: string, userId: string): Promise<UnreadCountResponse> {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new ForbiddenException('Not a member of this conversation');
      }

      return {
        conversationId,
        unreadCount: membership.unreadCount
      };
    },

    async getUnreadSummary(userId: string): Promise<UnreadSummaryResponse> {
      const memberships = await ConversationMember.find({
        userId
      }).lean();

      const conversations = memberships.map((m) => ({
        conversationId: m.conversationId.toString(),
        unreadCount: m.unreadCount,
        muted: m.muted
      }));

      const totalUnread = conversations
        .filter((c) => !c.muted)
        .reduce((sum, c) => sum + c.unreadCount, 0);

      return {
        totalUnread,
        conversations
      };
    },

    async computeReadStatus(messageSentAt: Date, conversationId: string, isDM: boolean) {
      if (isDM) {
        const otherMember = await ConversationMember.findOne({
          conversationId,
          lastReadAt: { $gte: messageSentAt }
        });

        return {
          isRead: !!otherMember,
          readAt: otherMember?.lastReadAt?.toISOString() ?? null
        };
      }

      const readCount = await ConversationMember.countDocuments({
        conversationId,
        lastReadAt: { $gte: messageSentAt }
      });

      const totalMembers = await ConversationMember.countDocuments({
        conversationId
      });

      return {
        readCount,
        totalMembers
      };
    }
  };
}
