import mongoose from 'mongoose';
import { UserStatus } from '@chatz/shared';

export interface IUser {
  email: string;
  password: string;
  nickname: string;
  avatarUrl?: string;
  status: UserStatus;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.OFFLINE
    },
    lastSeenAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
