import mongoose from 'mongoose';
import { InviteStatus } from '@chatz/shared';

export interface IGroupInvite {
  conversationId: mongoose.Types.ObjectId;
  inviterId: mongoose.Types.ObjectId;
  inviteeId: mongoose.Types.ObjectId;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const groupInviteSchema = new mongoose.Schema<IGroupInvite>(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Conversation' },
    inviterId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    inviteeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    status: {
      type: String,
      required: true,
      enum: Object.values(InviteStatus),
      default: InviteStatus.PENDING
    },
    expiresAt: { type: Date, required: true }
  },
  {
    timestamps: true
  }
);

groupInviteSchema.index({ inviteeId: 1, status: 1 });
groupInviteSchema.index(
  { conversationId: 1, inviteeId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: InviteStatus.PENDING }
  }
);
groupInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const GroupInvite = mongoose.model<IGroupInvite>('GroupInvite', groupInviteSchema);
