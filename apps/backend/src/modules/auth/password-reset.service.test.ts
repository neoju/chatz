import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Mock } from 'vitest';

import makePasswordResetService from '@/modules/auth/password-reset.service.js';

vi.mock('@/modules/user/user.schema.js', () => ({
  User: {
    findOne: vi.fn(),
    updateOne: vi.fn()
  }
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn()
  }
}));

vi.mock('node:crypto', () => ({
  randomBytes: vi.fn(),
  createHash: vi.fn()
}));

import { User } from '@/modules/user/user.schema.js';
import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';

const mockFindOne = User.findOne as Mock;
const mockUpdateOne = User.updateOne as Mock;
const mockBcryptHash = bcrypt.hash as Mock;

function mockCreateHash() {
  return {
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue(TOKEN_HASH)
  };
}

function makeMockApp(overrides?: {
  eval?: (...args: unknown[]) => Promise<unknown>;
  getdel?: (key: string) => Promise<string | null>;
  srem?: () => Promise<number>;
  incr?: (key: string) => Promise<number>;
  expire?: () => Promise<number>;
}): FastifyInstance {
  const evalMock = vi.fn().mockResolvedValue(1);
  const getdelMock = vi.fn().mockResolvedValue(null);
  const sremMock = vi.fn().mockResolvedValue(1);
  const incrMock = vi.fn().mockResolvedValue(1);
  const expireMock = vi.fn().mockResolvedValue(1);

  if (overrides?.eval) {
    evalMock.mockImplementation(overrides.eval);
  }
  if (overrides?.getdel) {
    getdelMock.mockImplementation(overrides.getdel);
  }
  if (overrides?.srem) {
    sremMock.mockImplementation(overrides.srem);
  }
  if (overrides?.incr) {
    incrMock.mockImplementation(overrides.incr);
  }
  if (overrides?.expire) {
    expireMock.mockImplementation(overrides.expire);
  }

  const redis = {
    eval: evalMock,
    getdel: getdelMock,
    srem: sremMock,
    incr: incrMock,
    expire: expireMock
  };

  const sendPasswordResetEmailMock = vi.fn().mockResolvedValue(undefined);
  const logInfoMock = vi.fn();

  return {
    redis,
    config: {
      PWDRS_TTL: '900',
      PWDRS_RATE_LIMIT_PER_EMAIL: '3',
      PWDRS_RATE_LIMIT_COOLDOWN_SEC: '3600',
      FRONTEND_URL: 'https://chatz.example.com'
    },
    emailService: {
      sendPasswordResetEmail: sendPasswordResetEmailMock
    },
    log: {
      info: logInfoMock
    }
  } as unknown as FastifyInstance;
}

const RAW_TOKEN = Buffer.from('deadbeef'.repeat(8), 'hex');
const TOKEN_HASH = 'abc123hash';
const TOKENIZED = RAW_TOKEN.toString('base64url');
const USER_ID = 'user-id-123';
const USER_EMAIL = 'test@example.com';
const USER_NICKNAME = 'TestUser';

beforeEach(() => {
  vi.clearAllMocks();
  (randomBytes as Mock).mockReturnValue(RAW_TOKEN);
  (createHash as Mock).mockImplementation(mockCreateHash);
});

describe('createResetToken', () => {
  it('returns null when user not found (uniform response — no account enumeration)', async () => {
    mockFindOne.mockResolvedValue(null);
    const app = makeMockApp();
    const service = makePasswordResetService(app);

    const result = await service.createResetToken(USER_EMAIL);

    expect(result).toBeNull();
  });

  it('returns ResetTokenData when user exists', async () => {
    mockFindOne.mockResolvedValue({
      _id: { toString: () => USER_ID },
      nickname: USER_NICKNAME
    });
    const app = makeMockApp();
    const service = makePasswordResetService(app);

    const result = await service.createResetToken(USER_EMAIL);

    expect(result).not.toBeNull();
    expect(result?.tokenHash).toBe(TOKEN_HASH);
    expect(result?.tokenized).toBe(TOKENIZED);
    expect(result?.username).toBe(USER_NICKNAME);
    expect(result?.userId).toBe(USER_ID);
    expect(result?.rawToken).toBe(RAW_TOKEN);
  });

  it('invalidates prior tokens for the same user atomically via Lua script', async () => {
    mockFindOne.mockResolvedValue({
      _id: { toString: () => USER_ID },
      nickname: USER_NICKNAME
    });

    const app = makeMockApp();
    const service = makePasswordResetService(app);

    await service.createResetToken(USER_EMAIL);

    const evalMock = app.redis.eval as Mock;
    expect(evalMock).toHaveBeenCalledWith(
      expect.any(String),
      2,
      `pw_reset:user:${USER_ID}`,
      `pw_reset:${TOKEN_HASH}`,
      USER_ID,
      TOKEN_HASH,
      '900'
    );
  });

  it('does not log the raw token', async () => {
    mockFindOne.mockResolvedValue({
      _id: { toString: () => USER_ID },
      nickname: USER_NICKNAME
    });
    const app = makeMockApp();
    const service = makePasswordResetService(app);

    await service.createResetToken(USER_EMAIL);

    const logInfo = app.log.info as Mock;
    const logCalls = logInfo.mock.calls;
    for (const call of logCalls) {
      const loggedData = call[0];
      if (typeof loggedData === 'object' && loggedData !== null) {
        expect(loggedData).not.toHaveProperty('rawToken');
      }
      if (typeof loggedData === 'string') {
        expect(loggedData).not.toContain(RAW_TOKEN.toString('hex'));
        expect(loggedData).not.toContain(RAW_TOKEN.toString('base64url'));
      }
    }
  });
});

describe('consumeToken', () => {
  it('returns userId for a valid token', async () => {
    const app = makeMockApp({
      getdel: () => Promise.resolve(USER_ID)
    });
    const service = makePasswordResetService(app);

    const result = await service.consumeToken(TOKENIZED);

    expect(result).toBe(USER_ID);
  });

  it('returns null for an invalid or expired token', async () => {
    const app = makeMockApp({
      getdel: () => Promise.resolve(null)
    });
    const service = makePasswordResetService(app);

    const result = await service.consumeToken(TOKENIZED);

    expect(result).toBeNull();
  });

  it('returns null for an already-consumed token (single-use)', async () => {
    let callCount = 0;
    const app = makeMockApp({
      getdel: () => {
        callCount++;
        return callCount === 1 ? Promise.resolve(USER_ID) : Promise.resolve(null);
      }
    });
    const service = makePasswordResetService(app);

    const first = await service.consumeToken(TOKENIZED);
    const second = await service.consumeToken(TOKENIZED);

    expect(first).toBe(USER_ID);
    expect(second).toBeNull();
  });

  it('cleans up the user token set after consuming', async () => {
    const app = makeMockApp({
      getdel: () => Promise.resolve(USER_ID)
    });
    const service = makePasswordResetService(app);

    await service.consumeToken(TOKENIZED);

    const srem = app.redis.srem as Mock;
    expect(srem).toHaveBeenCalledWith(`pw_reset:user:${USER_ID}`, TOKEN_HASH);
  });
});

describe('checkEmailRateLimit', () => {
  it('returns true when under the limit', async () => {
    const app = makeMockApp({
      incr: () => Promise.resolve(1)
    });
    const service = makePasswordResetService(app);

    const result = await service.checkEmailRateLimit(USER_EMAIL);

    expect(result).toBe(true);
  });

  it('returns false when over the limit', async () => {
    const app = makeMockApp({
      incr: () => Promise.resolve(4)
    });
    const service = makePasswordResetService(app);

    const result = await service.checkEmailRateLimit(USER_EMAIL);

    expect(result).toBe(false);
  });

  it('sets TTL on first request', async () => {
    const app = makeMockApp({
      incr: () => Promise.resolve(1)
    });
    const service = makePasswordResetService(app);

    await service.checkEmailRateLimit(USER_EMAIL);

    const expire = app.redis.expire as Mock;
    expect(expire).toHaveBeenCalledWith(`rl:pw_reset:email:${USER_EMAIL}`, 3600);
  });

  it('does not reset TTL on subsequent requests', async () => {
    const app = makeMockApp({
      incr: () => Promise.resolve(2)
    });
    const service = makePasswordResetService(app);

    await service.checkEmailRateLimit(USER_EMAIL);

    const expire = app.redis.expire as Mock;
    expect(expire).not.toHaveBeenCalled();
  });
});

describe('handleForgotPassword', () => {
  it('sends email when user exists and rate limit allows', async () => {
    mockFindOne.mockResolvedValue({
      _id: { toString: () => USER_ID },
      nickname: USER_NICKNAME
    });
    const app = makeMockApp();
    const service = makePasswordResetService(app);

    await service.handleForgotPassword(USER_EMAIL);

    const sendEmail = app.emailService.sendPasswordResetEmail as Mock;
    expect(sendEmail).toHaveBeenCalledWith(
      USER_EMAIL,
      USER_NICKNAME,
      `https://chatz.example.com/reset-password?token=${TOKENIZED}`
    );
  });

  it('does not send email when user is not found', async () => {
    mockFindOne.mockResolvedValue(null);
    const app = makeMockApp();
    const service = makePasswordResetService(app);

    await service.handleForgotPassword(USER_EMAIL);

    const sendEmail = app.emailService.sendPasswordResetEmail as Mock;
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('skips email when rate-limited', async () => {
    const app = makeMockApp({
      incr: () => Promise.resolve(10)
    });
    const service = makePasswordResetService(app);

    await service.handleForgotPassword(USER_EMAIL);

    expect(mockFindOne).not.toHaveBeenCalled();
    const sendEmail = app.emailService.sendPasswordResetEmail as Mock;
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('resetPassword', () => {
  it('returns false for invalid or expired token', async () => {
    const app = makeMockApp({
      getdel: () => Promise.resolve(null)
    });
    const service = makePasswordResetService(app);

    const result = await service.resetPassword(TOKENIZED, 'newpassword123');

    expect(result).toBe(false);
    expect(mockBcryptHash).not.toHaveBeenCalled();
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it('hashes password and updates user for valid token', async () => {
    const app = makeMockApp({
      getdel: () => Promise.resolve(USER_ID)
    });
    mockBcryptHash.mockResolvedValue('hashedpassword');
    const service = makePasswordResetService(app);

    const result = await service.resetPassword(TOKENIZED, 'newpassword123');

    expect(result).toBe(true);
    expect(mockBcryptHash).toHaveBeenCalledWith('newpassword123', 10);
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: USER_ID }, { password: 'hashedpassword' });
  });
});
