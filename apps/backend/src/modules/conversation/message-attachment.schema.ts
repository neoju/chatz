import mongoose from 'mongoose';

export interface IMessageAttachment {
  messageId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const messageAttachmentSchema = new mongoose.Schema<IMessageAttachment>(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Message' },
    conversationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Conversation' },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  {
    timestamps: true
  }
);

messageAttachmentSchema.index({ messageId: 1 });
messageAttachmentSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageAttachment = mongoose.model<IMessageAttachment>('MessageAttachment', messageAttachmentSchema);
