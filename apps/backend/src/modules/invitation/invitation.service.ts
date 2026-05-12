import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { InviteStatus, ConversationRole, ConversationType } from '@chatz/shared';
import { CreateInviteRequest, InviteResponse } from '@chatz/dto';

import { GroupInvite, IGroupInvite } from '@/shared/schemas/group-invite.schema.js';
import { ConversationMember } from '@/shared/schemas/conversation-member.schema.js';
import { Conversation } from '@/shared/schemas/conversation.schema.js';
import { User } from '@/shared/schemas/user.schema.js';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  GoneException
} from '@/shared/errors.js';

export default function invitationService(_app: FastifyInstance) {
  async function mapInviteResponse(invite: IGroupInvite & { id: string }): Promise<InviteResponse> {
    const conversation = await Conversation.findById(invite.conversationId).lean();
    const inviter = await User.findById(invite.inviterId).lean();

    return {
      id: invite.id,
      conversationId: invite.conversationId.toString(),
      inviterId: invite.inviterId.toString(),
      inviteeId: invite.inviteeId.toString(),
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      conversationName: conversation?.name ?? null,
      inviterNickname: inviter?.nickname ?? null,
      createdAt: invite.createdAt.toISOString(),
      updatedAt: invite.updatedAt.toISOString()
    };
  }

  return {
    async createInvite(params: CreateInviteRequest, userId: string) {
      const membership = await ConversationMember.findOne({
        conversationId: params.conversationId,
        userId
      });

      if (!membership) {
        throw new ForbiddenException('Not a member of this conversation');
      }

      if (membership.role !== ConversationRole.ADMIN) {
        throw new ForbiddenException('Only admins can create invites');
      }

      const conversation = await Conversation.findOne({
        _id: params.conversationId,
        deletedAt: null
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type !== ConversationType.GROUP) {
        throw new BadRequestException('Can only invite to group conversations');
      }

      const existingMember = await ConversationMember.findOne({
        conversationId: params.conversationId,
        userId: params.inviteeId
      });

      if (existingMember) {
        throw new BadRequestException('User is already a member');
      }

      const existingInvite = await GroupInvite.findOne({
        conversationId: params.conversationId,
        inviteeId: params.inviteeId,
        status: InviteStatus.PENDING
      });

      if (existingInvite) {
        throw new ConflictException('Pending invite already exists for this user');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invite = new GroupInvite({
        conversationId: new mongoose.Types.ObjectId(params.conversationId),
        inviterId: new mongoose.Types.ObjectId(userId),
        inviteeId: new mongoose.Types.ObjectId(params.inviteeId),
        status: InviteStatus.PENDING,
        expiresAt
      });

      await invite.save();

      return mapInviteResponse({ ...invite.toObject(), id: invite.id });
    },

    async listPendingInvites(userId: string) {
      const invites = await GroupInvite.aggregate([
        { $match: { inviteeId: new mongoose.Types.ObjectId(userId), status: InviteStatus.PENDING, expiresAt: { $gt: new Date() } } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'conversations',
            localField: 'conversationId',
            foreignField: '_id',
            as: 'conversation'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'inviterId',
            foreignField: '_id',
            as: 'inviter'
          }
        },
        {
          $project: {
            id: { $toString: '$_id' },
            conversationId: { $toString: '$conversationId' },
            inviterId: { $toString: '$inviterId' },
            inviteeId: { $toString: '$inviteeId' },
            status: 1,
            expiresAt: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S.%LZ', date: '$expiresAt' } },
            conversationName: { $arrayElemAt: ['$conversation.name', 0] },
            inviterNickname: { $arrayElemAt: ['$inviter.nickname', 0] },
            createdAt: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S.%LZ', date: '$createdAt' } },
            updatedAt: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S.%LZ', date: '$updatedAt' } }
          }
        }
      ]);

      return invites as InviteResponse[];
    },

    async acceptInvite(inviteId: string, userId: string) {
      const invite = await GroupInvite.findById(inviteId);
      if (!invite) {
        throw new NotFoundException('Invite not found');
      }

      if (invite.inviteeId.toString() !== userId) {
        throw new ForbiddenException('Cannot accept another user invite');
      }

      if (invite.status !== InviteStatus.PENDING) {
        throw new ConflictException('Invite is no longer pending');
      }

      if (invite.expiresAt < new Date()) {
        throw new GoneException('Invite has expired');
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        invite.status = InviteStatus.ACCEPTED;
        await invite.save({ session });

        const membership = new ConversationMember({
          userId: new mongoose.Types.ObjectId(userId),
          conversationId: invite.conversationId,
          role: ConversationRole.MEMBER,
          joinedAt: new Date()
        });

        await membership.save({ session });

        await session.commitTransaction();

        return { success: true };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        void session.endSession();
      }
    },

    async declineInvite(inviteId: string, userId: string) {
      const invite = await GroupInvite.findById(inviteId);
      if (!invite) {
        throw new NotFoundException('Invite not found');
      }

      if (invite.inviteeId.toString() !== userId) {
        throw new ForbiddenException('Cannot decline another user invite');
      }

      if (invite.status !== InviteStatus.PENDING) {
        throw new ConflictException('Invite is no longer pending');
      }

      invite.status = InviteStatus.DECLINED;
      await invite.save();
    }
  };
}
