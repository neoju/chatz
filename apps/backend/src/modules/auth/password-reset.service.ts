import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';

import { User } from '@/modules/user/user.schema.js';
import type { ResetTokenData } from './password-reset.types.js';

/**
 * Atomically invalidates all prior tokens for a user and sets a new one.
 * Eliminates the TOCTOU race between smembers + multi/exec.
 */
const LUA_RESET_TOKEN = `
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
`;

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

    const ttl = Number(app.config.PWDRS_TTL);
    const userSetKey = `pw_reset:user:${userId}`;
    const tokenKey = `pw_reset:${tokenHash}`;

    const NUM_KEYS = 2; // KEYS[1] = userSetKey, KEYS[2] = tokenKey
    await app.redis.eval(LUA_RESET_TOKEN, NUM_KEYS, userSetKey, tokenKey, userId, tokenHash, String(ttl));

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
