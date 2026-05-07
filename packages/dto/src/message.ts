import { z } from 'zod/v4';
import { MessageContentType } from '@chatz/shared';

export const SendMessageRequestSchema = z
  .object({
    conversationId: z.string().min(1).describe('Target conversation ID'),
    content: z.string().min(1).max(10000).describe('Message content'),
    contentType: z.enum([MessageContentType.TEXT, MessageContentType.IMAGE, MessageContentType.FILE]).optional().describe('Message content type'),
    replyTo: z.string().optional().describe('Message ID being replied to'),
    attachments: z.array(
      z.object({
        url: z.string().describe('Attachment URL'),
        filename: z.string().describe('Original filename'),
        mimeType: z.string().describe('MIME type'),
        size: z.number().describe('File size in bytes')
      })
    ).optional().describe('Message attachments')
  })
  .describe('Send message request body');

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

export const MessageResponseSchema = z
  .object({
    id: z.string().describe('Message ID'),
    conversationId: z.string().describe('Conversation ID'),
    senderId: z.string().describe('Sender user ID'),
    content: z.string().describe('Message content'),
    contentType: z.enum([MessageContentType.TEXT, MessageContentType.IMAGE, MessageContentType.FILE]).describe('Content type'),
    replyTo: z.object({
      id: z.string().describe('Replied message ID'),
      content: z.string().describe('Replied message content preview'),
      senderId: z.string().describe('Replied message sender ID')
    }).nullable().describe('Reply reference'),
    attachments: z.array(
      z.object({
        url: z.string().describe('Attachment URL'),
        filename: z.string().describe('Original filename'),
        mimeType: z.string().describe('MIME type'),
        size: z.number().describe('File size in bytes')
      })
    ).describe('Message attachments'),
    editedAt: z.string().nullable().describe('Edit timestamp'),
    deletedAt: z.string().nullable().describe('Delete timestamp'),
    readBy: z.number().describe('Number of members who have read this message'),
    sentAt: z.string().describe('Message sent timestamp'),
    createdAt: z.string().describe('Creation timestamp'),
    updatedAt: z.string().describe('Last update timestamp')
  })
  .describe('Message response');

export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const EditMessageRequestSchema = z
  .object({
    content: z.string().min(1).max(10000).describe('Updated message content')
  })
  .describe('Edit message request body');

export type EditMessageRequest = z.infer<typeof EditMessageRequestSchema>;

export const ListMessagesQuerySchema = z
  .object({
    conversationId: z.string().min(1).describe('Conversation ID'),
    cursor: z.string().optional().describe('Pagination cursor (base64 encoded)'),
    limit: z.coerce.number().min(1).max(100).default(50).describe('Number of messages to return')
  })
  .describe('List messages query parameters');

export type ListMessagesQuery = z.infer<typeof ListMessagesQuerySchema>;
