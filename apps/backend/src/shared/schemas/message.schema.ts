import mongoose from 'mongoose';
import { MessageContentType } from '@chatz/shared';

export interface IMessage {
  id: string;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  contentType: MessageContentType;
  replyTo?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  editedAt?: Date;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Conversation' },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    content: { type: String, required: true },
    contentType: {
      type: String,
      required: true,
      enum: Object.values(MessageContentType),
      default: MessageContentType.TEXT
    },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    deletedAt: { type: Date, default: null },
    editedAt: { type: Date, default: null },
    sentAt: { type: Date, required: true, default: Date.now }
  },
  {
    timestamps: true,
    versionKey: '__v'
  }
);

messageSchema.index({ conversationId: 1, sentAt: -1, _id: -1 });
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ content: 'text' });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
