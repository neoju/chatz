import mongoose from 'mongoose';
import { ConversationRole } from '@chatz/shared';

export interface IConversationMember {
  userId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  nickname?: string;
  role: ConversationRole;
  pinned: boolean;
  muted: boolean;
  unreadCount: number;
  lastReadMessageId?: mongoose.Types.ObjectId;
  lastReadAt?: Date;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const conversationMemberSchema = new mongoose.Schema<IConversationMember>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    conversationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Conversation' },
    nickname: { type: String, default: null },
    role: {
      type: String,
      required: true,
      enum: Object.values(ConversationRole),
      default: ConversationRole.MEMBER
    },
    pinned: { type: Boolean, default: false },
    muted: { type: Boolean, default: false },
    unreadCount: { type: Number, default: 0 },
    lastReadMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    lastReadAt: { type: Date, default: null },
    joinedAt: { type: Date, required: true, default: Date.now }
  },
  {
    timestamps: true,
    versionKey: '__v'
  }
);

conversationMemberSchema.index({ userId: 1, conversationId: 1 }, { unique: true });
conversationMemberSchema.index({ conversationId: 1 });
conversationMemberSchema.index({ userId: 1, pinned: 1 });

export const ConversationMember = mongoose.model<IConversationMember>('ConversationMember', conversationMemberSchema);
