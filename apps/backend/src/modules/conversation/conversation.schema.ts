import mongoose from 'mongoose';
import { ConversationType } from '@chatz/shared';

export interface IConversation {
  type: ConversationType;
  name?: string;
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
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    versionKey: '__v'
  }
);

conversationSchema.index({ type: 1 });
conversationSchema.index({ createdAt: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
