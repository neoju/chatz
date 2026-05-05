import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';

import { User } from '@/modules/user/user.schema.js';

interface ResetTokenData {
  /** Raw 32-byte CSPRNG token — never logged or stored */
  rawToken: Buffer;
  /** SHA-256 hex hash — stored in Redis as `pw_reset:<hash>` */
  tokenHash: string;
  /** URL-safe base64 encoding for embedding in reset links */
  tokenized: string;
  username: string;
  userId: string;
}

export default (app: FastifyInstance) => ({
  async createResetToken(email: string): Promise<ResetTokenData | null> {
    const user = await User.findOne({ email });

    if (!user) {
      return null;
    }

    const rawToken = randomBytes(32);
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const userSetKey = `pw_reset:user:${user.id}`;
    const tokenKey = `pw_reset:${tokenHash}`;

    await app.redis.eval(
      // Atomically invalidates all prior tokens for a user and sets a new one.
      // Eliminates the TOCTOU race between smembers + multi/exec.
      `
      local userSetKey = KEYS[1]
      local tokenKey = KEYS[2]

      local userId = ARGV[1]
      local tokenHash = ARGV[2]
      local ttl = tonumber(ARGV[3])

      local existingHashes = redis.call('SMEMBERS', userSetKey)
      for _, hash in ipairs(existingHashes) do
        redis.call('DEL', 'pw_reset:' .. hash)
      end

      redis.call('SET', tokenKey, userId, 'EX', ttl)
      redis.call('DEL', userSetKey)
      redis.call('SADD', userSetKey, tokenHash)
      redis.call('EXPIRE', userSetKey, ttl)

      return 1
      `,
      // KEYS for the lua script: userSetKey, tokenKey
      // 2 is the number of keys
      // Redis expects we specify how many keys we're passing before the keys themselves
      2, userSetKey, tokenKey,
      // ARGV for the lua script: userId, tokenHash, TTL
      user.id, tokenHash, app.config.PWDRS_TTL);

    app.log.info({ tokenHash, userId: user.id }, 'Password reset token created');

    return {
      rawToken,
      tokenHash,
      tokenized: rawToken.toString('base64url'),
      userId: user.id,
      username: user.nickname,
    };
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
    const limit = Number(app.config.PWDRS_RATE_LIMIT_PER_EMAIL);
    const window = Number(app.config.PWDRS_RATE_LIMIT_COOLDOWN_SEC);

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
    const normalizedEmail = email.toLowerCase();
    const allowed = await this.checkEmailRateLimit(normalizedEmail);
    if (!allowed) {
      return;
    }

    const tokenData = await this.createResetToken(normalizedEmail);
    if (tokenData) {
      const resetLink = `${app.config.FRONTEND_URL}/reset-password?token=${tokenData.tokenized}`;
      await app.emailService.sendPasswordResetEmail(normalizedEmail, tokenData.username, resetLink);
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
