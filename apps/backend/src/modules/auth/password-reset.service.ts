import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';

import { User } from '@/modules/user/user.schema.js';
import type { ResetTokenData } from './password-reset.types.js';

export default (app: FastifyInstance) => ({
  async createResetToken(email: string): Promise<ResetTokenData | null> {
    const user = await User.findOne({ email });

    if (!user) {
      return null;
    }

    const userId = user._id.toString();
    const rawToken = randomBytes(32);
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenized = rawToken.toString('base64url');
    const username = user.nickname;

    const ttl = Number(app.config.PASSWORD_RESET_TTL_SECONDS);
    const userSetKey = `pw_reset:user:${userId}`;
    const tokenKey = `pw_reset:${tokenHash}`;

    // Invalidate any prior tokens for this user
    const existingHashes = await app.redis.smembers(userSetKey);
    const pipeline = app.redis.multi();

    for (const oldHash of existingHashes) {
      pipeline.del(`pw_reset:${oldHash}`);
    }

    // Store new token atomically
    pipeline.set(tokenKey, userId, 'EX', ttl);
    pipeline.del(userSetKey);
    pipeline.sadd(userSetKey, tokenHash);
    pipeline.expire(userSetKey, ttl);

    await pipeline.exec();

    app.log.info({ tokenHash, userId }, 'Password reset token created');

    return { rawToken, tokenHash, tokenized, username, userId };
  },

  async consumeToken(tokenized: string): Promise<string | null> {
    const rawBuffer = Buffer.from(tokenized, 'base64url');
    const tokenHash = createHash('sha256').update(rawBuffer).digest('hex');

    const userId = await app.redis.getdel(`pw_reset:${tokenHash}`);

    if (userId === null) {
      return null;
    }

    await app.redis.srem(`pw_reset:user:${userId}`, tokenHash);

    app.log.info({ tokenHash, userId }, 'Password reset token consumed');

    return userId;
  },

  async checkEmailRateLimit(email: string): Promise<boolean> {
    const key = `rl:pw_reset:email:${email}`;
    const limit = Number(app.config.PASSWORD_RESET_RATE_LIMIT_PER_EMAIL);
    const window = Number(app.config.PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS);

    const count = await app.redis.incr(key);

    if (count === 1) {
      await app.redis.expire(key, window);
    }

    if (count > limit) {
      return false;
    }

    return true;
  },

  async handleForgotPassword(email: string): Promise<void> {
    const allowed = await this.checkEmailRateLimit(email);
    if (!allowed) {
      return;
    }

    const tokenData = await this.createResetToken(email);
    if (tokenData) {
      const resetLink = `${app.config.FRONTEND_URL}/reset-password?token=${tokenData.tokenized}`;
      await app.emailService.sendPasswordResetEmail(email, tokenData.username, resetLink);
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const userId = await this.consumeToken(token);
    if (!userId) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ _id: userId }, { password: hashedPassword });

    return true;
  }
});
