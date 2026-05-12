import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { ConversationRole } from '@chatz/shared';
import { UpdateMemberRequest, MemberResponse, MemberNicknameRequest } from '@chatz/dto';

import { ConversationMember, IConversationMember } from '@/shared/schemas/conversation-member.schema.js';
import { Conversation } from '@/shared/schemas/conversation.schema.js';
import { BadRequestException, ForbiddenException, NotFoundException } from '@/shared/errors.js';

export default function membershipService(_app: FastifyInstance) {
  async function mapMemberResponse(member: IConversationMember & { id: string }): Promise<MemberResponse> {
    return {
      id: member.id,
      userId: member.userId.toString(),
      conversationId: member.conversationId.toString(),
      nickname: member.nickname ?? null,
      role: member.role,
      pinned: member.pinned,
      muted: member.muted,
      unreadCount: member.unreadCount,
      lastReadMessageId: member.lastReadMessageId?.toString() ?? null,
      lastReadAt: member.lastReadAt?.toISOString() ?? null,
      joinedAt: member.joinedAt.toISOString(),
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString()
    };
  }

  return {
    async joinConversation(conversationId: string, userId: string) {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        deletedAt: null
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const existingMembership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (existingMembership) {
        throw new BadRequestException('Already a member of this conversation');
      }

      const membership = new ConversationMember({
        userId: new mongoose.Types.ObjectId(userId),
        conversationId: new mongoose.Types.ObjectId(conversationId),
        role: ConversationRole.MEMBER,
        joinedAt: new Date()
      });

      await membership.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastActivityAt: new Date(),
        updatedAt: new Date()
      });

      await ConversationMember.updateMany(
        { conversationId },
        { $set: { updatedAt: new Date() } }
      );

      return mapMemberResponse({ ...membership.toObject(), id: membership.id });
    },

    async leaveConversation(conversationId: string, userId: string) {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new NotFoundException('Not a member of this conversation');
      }

      if (membership.role === ConversationRole.ADMIN) {
        const adminCount = await ConversationMember.countDocuments({
          conversationId,
          role: ConversationRole.ADMIN,
          _id: { $ne: membership._id }
        });

        if (adminCount === 0) {
          throw new BadRequestException('Last admin cannot leave the conversation');
        }
      }

      await ConversationMember.deleteOne({ _id: membership._id });

      const remainingMembers = await ConversationMember.countDocuments({
        conversationId
      });

      if (remainingMembers === 0) {
        await Conversation.findByIdAndUpdate(conversationId, { deletedAt: new Date() });
      } else {
        await Conversation.findByIdAndUpdate(conversationId, {
          lastActivityAt: new Date(),
          updatedAt: new Date()
        });

        await ConversationMember.updateMany(
          { conversationId },
          { $set: { updatedAt: new Date() } }
        );
      }
    },

    async updateMemberRole(
      conversationId: string,
      targetUserId: string,
      requestingUserId: string,
      params: UpdateMemberRequest
    ) {
      const requestingMembership = await ConversationMember.findOne({
        conversationId,
        userId: requestingUserId
      });

      if (!requestingMembership) {
        throw new ForbiddenException('Not a member of this conversation');
      }

      if (requestingMembership.role !== ConversationRole.ADMIN) {
        throw new ForbiddenException('Only admins can update member roles');
      }

      const targetMembership = await ConversationMember.findOne({
        conversationId,
        userId: targetUserId
      });

      if (!targetMembership) {
        throw new NotFoundException('User is not a member of this conversation');
      }

      targetMembership.role = params.role;
      await targetMembership.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastActivityAt: new Date(),
        updatedAt: new Date()
      });

      await ConversationMember.updateMany(
        { conversationId },
        { $set: { updatedAt: new Date() } }
      );

      return mapMemberResponse({ ...targetMembership.toObject(), id: targetMembership.id });
    },

    async pinConversation(conversationId: string, userId: string, pinned: boolean) {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new NotFoundException('Not a member of this conversation');
      }

      membership.pinned = pinned;
      await membership.save();

      return mapMemberResponse({ ...membership.toObject(), id: membership.id });
    },

    async muteConversation(conversationId: string, userId: string, muted: boolean) {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new NotFoundException('Not a member of this conversation');
      }

      membership.muted = muted;
      await membership.save();

      return mapMemberResponse({ ...membership.toObject(), id: membership.id });
    },

    async updateNickname(
      conversationId: string,
      userId: string,
      params: MemberNicknameRequest
    ) {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new NotFoundException('Not a member of this conversation');
      }

      membership.nickname = params.nickname;
      await membership.save();

      return mapMemberResponse({ ...membership.toObject(), id: membership.id });
    }
  };
}
