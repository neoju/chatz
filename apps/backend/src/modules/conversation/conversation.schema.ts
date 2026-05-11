import mongoose from 'mongoose';
import { ConversationType } from '@chatz/shared';

export interface IConversation {
  type: ConversationType;
  name?: string;
  lastMessage?: {
    content: string;
    senderId?: mongoose.Types.ObjectId;
    sentAt: Date;
  };
  lastActivityAt: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const conversationSchema = new mongoose.Schema<IConversation>(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(ConversationType)
    },
    name: { type: String, default: null },
    lastMessage: {
      content: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sentAt: { type: Date }
    },
    lastActivityAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    versionKey: '__v'
  }
);

conversationSchema.index({ type: 1 });
conversationSchema.index({ lastActivityAt: -1 });
conversationSchema.index({ createdAt: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
