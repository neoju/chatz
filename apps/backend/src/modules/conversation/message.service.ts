import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { MessageContentType, ConversationRole } from '@chatz/shared';
import { SendMessageRequest, EditMessageRequest, MessageResponse } from '@chatz/dto';

import { DEFAULT_PAGE_LIMIT } from '@/shared/constants.js';

import { Message, IMessage } from './message.schema.js';
import { MessageAttachment } from './message-attachment.schema.js';
import { ConversationMember } from './conversation-member.schema.js';
import { Conversation } from './conversation.schema.js';
import { encodeCursor, decodeCursor } from './cursor.utils.js';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@/shared/errors.js';

const EDIT_TIME_LIMIT_MS = 15 * 60 * 1000;

export default function messageService(app: FastifyInstance) {
  async function mapToResponse(message: IMessage, conversationId: string): Promise<MessageResponse> {
    let replyTo = null;

    if (message.replyTo) {
      const repliedMsg = await Message.findById(message.replyTo).lean();

      if (repliedMsg) {
        replyTo = {
          id: repliedMsg._id.toString(),
          content: repliedMsg.content.substring(0, 100),
          senderId: repliedMsg.senderId.toString()
        };
      } else {
        app.log.error(`Failed to find replied message with ID ${message.replyTo} for message ${message.id}`);
      }
    }

    const attachments = await MessageAttachment.find({ messageId: message.id }).lean();

    const readBy = await ConversationMember.countDocuments({
      conversationId,
      lastReadAt: { $gte: message.sentAt }
    });

    return {
      id: message.id,
      conversationId: message.conversationId.toString(),
      senderId: message.senderId.toString(),
      content: message.deletedAt ? 'This message was deleted' : message.content,
      contentType: message.contentType,
      replyTo,
      attachments: attachments.map((a) => ({
        url: a.url,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size
      })),
      editedAt: message.editedAt?.toISOString() ?? null,
      deletedAt: message.deletedAt?.toISOString() ?? null,
      readBy,
      sentAt: message.sentAt.toISOString(),
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString()
    };
  }

  return {
    async sendMessage(params: SendMessageRequest, userId: string) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // TODO: need to optimize this by caching, this is the hotest path in the app
        const conversation = await Conversation.findOne({
          _id: params.conversationId,
          deletedAt: null
        }).session(session);

        if (!conversation) {
          throw new NotFoundException('Conversation not found');
        }

        const message = new Message({
          conversationId: new mongoose.Types.ObjectId(params.conversationId),
          senderId: new mongoose.Types.ObjectId(userId),
          content: params.content,
          contentType: params.contentType ?? MessageContentType.TEXT,
          replyTo: params.replyTo ? new mongoose.Types.ObjectId(params.replyTo) : undefined,
          sentAt: new Date()
        });

        await message.save({ session });

        if (params.attachments && params.attachments.length > 0) {
          const attachmentDocs = params.attachments.map((a) => ({
            messageId: message._id,
            conversationId: new mongoose.Types.ObjectId(params.conversationId),
            url: a.url,
            filename: a.filename,
            mimeType: a.mimeType,
            size: a.size
          }));
          await MessageAttachment.insertMany(attachmentDocs, { session });
        }

        await Conversation.findByIdAndUpdate(params.conversationId, {
          updatedAt: new Date(),
          lastActivityAt: new Date(),
          lastMessage: {
            content: params.content,
            senderId: new mongoose.Types.ObjectId(userId),
            sentAt: new Date()
          }
        }).session(session);

        await ConversationMember.updateMany(
          { conversationId: params.conversationId },
          { $set: { updatedAt: new Date() } },
          { session }
        );

        await ConversationMember.updateMany(
          {
            conversationId: params.conversationId,
            userId: { $ne: userId },
            muted: false
          },
          { $inc: { unreadCount: 1 } },
          { session }
        );

        await session.commitTransaction();

        return mapToResponse({ ...message.toObject(), id: message.id }, params.conversationId);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        void session.endSession();
      }
    },

    async listMessages(conversationId: string, userId: string, limit: number = DEFAULT_PAGE_LIMIT, cursor?: string) {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new ForbiddenException('Not a member of this conversation');
      }

      const query: Record<string, unknown> = {
        conversationId,
        deletedAt: null
      };

      if (cursor) {
        const decoded = decodeCursor<{ sentAt: string; _id: string }>(cursor);
        query.$or = [
          { sentAt: { $lt: new Date(decoded.sentAt) } },
          { sentAt: new Date(decoded.sentAt), _id: { $lt: new mongoose.Types.ObjectId(decoded._id) } }
        ];
      }

      const messages = await Message.find(query)
        .sort({ sentAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean();

      const hasMore = messages.length > limit;
      const items = messages.slice(0, limit);

      let nextCursor: string | null = null;
      if (hasMore && items.length > 0) {
        const lastMsg = items[items.length - 1]!;
        nextCursor = encodeCursor({ sentAt: lastMsg.sentAt.toISOString(), _id: lastMsg._id.toString() });
      }

      const results = await Promise.all(
        items.map((msg) =>
          mapToResponse({ ...msg, id: msg._id.toString() }, conversationId)
        )
      );

      return {
        items: results,
        nextCursor,
        hasMore
      };
    },

    async editMessage(messageId: string, userId: string, params: EditMessageRequest) {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      if (message.senderId.toString() !== userId) {
        throw new ForbiddenException('Cannot edit another user message');
      }

      if (message.deletedAt) {
        throw new BadRequestException('Cannot edit a deleted message');
      }

      const now = new Date();
      const timeSinceSent = now.getTime() - message.sentAt.getTime();
      if (timeSinceSent > EDIT_TIME_LIMIT_MS) {
        throw new ForbiddenException('Edit window has expired (15 minutes)');
      }

      message.content = params.content;
      message.editedAt = now;
      await message.save();

      return mapToResponse({ ...message.toObject(), id: message.id }, message.conversationId.toString());
    },

    async deleteMessage(messageId: string, userId: string) {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      let isAdmin = false;
      if (message.senderId.toString() !== userId) {
        const membership = await ConversationMember.findOne({
          conversationId: message.conversationId,
          userId
        });
        if (!membership) {
          throw new ForbiddenException('Not a member of this conversation');
        }
        isAdmin = membership.role === ConversationRole.ADMIN;
      }

      if (message.senderId.toString() !== userId && !isAdmin) {
        throw new ForbiddenException('Cannot delete another user message');
      }

      message.deletedAt = new Date();
      await message.save();
    },

    async searchMessages(
      conversationId: string,
      userId: string,
      query: string,
      limit: number = 20,
      cursor?: string
    ) {
      const membership = await ConversationMember.findOne({
        conversationId,
        userId
      });

      if (!membership) {
        throw new ForbiddenException('Not a member of this conversation');
      }

      const skip = cursor ? parseInt(Buffer.from(cursor, 'base64').toString('utf-8'), 10) : 0;

      const [results, total] = await Promise.all([
        Message.find(
          {
            conversationId,
            deletedAt: null,
            $text: { $search: query }
          },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit + 1)
          .lean(),
        Message.countDocuments({
          conversationId,
          deletedAt: null,
          $text: { $search: query }
        })
      ]);

      const hasMore = results.length > limit;
      const items = results.slice(0, limit);

      let nextCursor: string | null = null;
      if (hasMore) {
        nextCursor = Buffer.from((skip + limit).toString()).toString('base64');
      }

      const mappedResults = await Promise.all(
        items.map(async (msg) => ({
          id: msg._id.toString(),
          content: msg.content,
          senderId: msg.senderId.toString(),
          sentAt: msg.sentAt.toISOString(),
          score: ((msg as unknown) as Record<string, unknown>).score as number
        }))
      );

      return {
        results: mappedResults,
        total,
        nextCursor
      };
    }
  };
}
