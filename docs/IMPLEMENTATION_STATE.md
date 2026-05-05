# Forgot Password — Email Delivery: Implementation State

**Saved:** 2026-05-05
**Status:** Oracle review NOT VERIFIED — 8 issues found, fixes needed before completion

---

## Original Task

Implement the Forgot Password — Email Delivery feature per `docs/forgot-password-design.md` by creating a detailed plan and delegating tasks to subagents.

---

## Completed Work

All 7 waves of implementation were completed and pass the pre-push gate (`pnpm format && pnpm lint && pnpm check-types && pnpm build` all green, 28/28 tests passing).

### Files Created/Modified

| Wave | Files | Status |
|------|-------|--------|
| **F1 — Config** | `apps/backend/src/plugins/config.ts` (added PASSWORD_RESET_* env vars + FRONTEND_URL + SMTP_*) | ✅ |
| **F2 — Crypto** | `apps/backend/src/shared/crypto.ts` — **DELETED** (builtins inlined per user request) | ✅ |
| **F3 — Email template** | `packages/email-template/` (entire package: React Email template, components, vitest) | ✅ |
| **F4 — DTOs** | `packages/dto/src/password-reset.ts` (ForgotPassword + ResetPassword Zod v4 DTOs) | ✅ |
| **F5 — Vitest** | `apps/backend/vitest.config.ts` | ✅ |
| **F6 — Types** | `apps/backend/src/modules/email/types.ts` (EmailMessage, SendResult, SendError, EmailSender) | ✅ |
| **I1 — Redis** | `apps/backend/src/plugins/redis.ts` (fp-wrapped, maxRetriesPerRequest: null) | ✅ |
| **I2 — SMTP sender** | `apps/backend/src/modules/email/smtp.sender.ts` + `smtp.sender.test.ts` | ✅ |
| **I3 — Template** | `packages/email-template/emails/password-reset.tsx` (React Email HTML+text) | ✅ |
| **S1 — Email service** | `apps/backend/src/modules/email/email.service.ts` (queue-based, call-time app.emailQueue access) | ✅ |
| **S2 — Password reset service** | `apps/backend/src/modules/auth/password-reset.service.ts` + `password-reset.types.ts` | ✅ |
| **X1 — Email plugin** | `apps/backend/src/modules/email/email.plugin.ts` (register queue+worker+service) | ✅ |
| **X2 — Auth router** | `apps/backend/src/modules/auth/auth.router.ts` (forgot-password + reset-password endpoints, rate-limit) | ✅ |
| **X3 — Server wiring** | `apps/backend/src/server.ts` (redis, rateLimit, emailPlugin, authRouter) | ✅ |
| **Q1 — BullMQ queue/worker** | `apps/backend/src/modules/email/email.queue.ts` + `email.worker.ts` + `email.service.test.ts` | ✅ |
| **H1 — Template tests** | `packages/email-template/tests/password-reset.test.tsx` (5 tests) | ✅ |
| **H2 — Service tests** | `password-reset.service.test.ts` (17) + `smtp.sender.test.ts` (4) + `email.service.test.ts` (2) | ✅ |

### Key Decisions Made During Implementation

- Factory pattern `(app: FastifyInstance) => ({ ... })` for all services
- `fp()` wrapping for redis.ts and email.plugin.ts
- `SendError` as class (not interface) for `instanceof` checks
- BullMQ queue pattern: service enqueues, worker renders+sends
- Redis key design: `pw_reset:<hash>` → userId with `GETDEL` for atomic single-use
- Config vars as `string` type (matching @fastify/env pattern)
- Tests colocated in `src/` alongside source files
- `maxRetriesPerRequest: null` on shared Redis connection (required by BullMQ)
- `crypto.ts` deleted — builtins (`randomBytes`, `createHash`, `Buffer.from`) used directly
- Router is thin — only extracts body params and calls service methods
- `email.service.ts` reads `app.emailQueue` at call time (fixed Oracle-identified runtime bug)
- `JobAttemptInfo` named interface in email.worker.ts
- `.env.example` includes PORT + HOST

---

## Oracle-Identified Issues (NOT YET FIXED)

Oracle review found 8 issues. These must be fixed before the task is complete.

### BLOCKING Issues

#### 1. HIGH — Race condition: concurrent reset requests can leave multiple valid tokens
- **File:** `apps/backend/src/modules/auth/password-reset.service.ts:26-40`
- **Problem:** `smembers()` reads existing hashes before `multi()`. Two concurrent requests can both see the same set, both create new token keys, and both tokens remain valid because `consumeToken()` only checks `pw_reset:<hash>`.
- **Fix options:**
  - Lua script for atomic invalidation+creation
  - Redis `WATCH`/`MULTI` transaction
  - Store a "current token hash per user" pointer checked during consume
- **Recommended:** Lua script via `redis.eval()` — atomically deletes old token keys and sets the new one in a single Redis call.

#### 2. MAJOR — `as unknown as FastifyInstance` type-safety policy violations in tests
- **Files:**
  - `apps/backend/src/modules/auth/password-reset.service.test.ts:111` — `} as unknown as FastifyInstance;`
  - `apps/backend/src/modules/email/email.service.test.ts:22` — `} as unknown as FastifyInstance & { queueCalls: QueueCall[]; addMock: Mock };`
- **Problem:** Root `AGENTS.md` zero-tolerance contract explicitly bans `as unknown as T`.
- **Fix:** Create properly typed mock helpers that satisfy FastifyInstance without casting, OR use `vi.fn()` mocks that structurally match the required interface. The eslint-config has test-specific overrides for `unbound-method` and `no-unsafe-*`, but `no-explicit-any` and `ban-ts-comment` still apply. Need to construct mock objects that satisfy FastifyInstance's required properties without `as unknown as`.

#### 3. HIGH — Redis connection failure is swallowed
- **File:** `apps/backend/src/plugins/redis.ts:19-21`
- **Problem:** `.catch()` logs the error but does not re-throw. The server starts without a working Redis connection, making forgot/reset flows fail at runtime instead of failing fast.
- **Fix:** Re-throw after logging: `app.log.error({ err }, 'Failed to connect to Redis'); throw err;`

#### 4. MAJOR — Per-email rate limit bypassable by casing/normalization
- **File:** `apps/backend/src/modules/auth/password-reset.service.ts:64-69`
- **Problem:** `checkEmailRateLimit()` uses raw email as Redis key. `User@Example.com` and `user@example.com` create separate buckets. Also `createResetToken()` line 10 queries `{ email }` without normalizing.
- **Fix:** Normalize email to lowercase before rate-limit keys and user lookup:
  ```ts
  const normalizedEmail = email.toLowerCase();
  ```
  Apply in both `checkEmailRateLimit()` and `handleForgotPassword()` (for the User.findOne query).

#### 5. MAJOR — Rate limit 429 violates uniform response design
- **File:** `apps/backend/src/modules/auth/auth.router.ts:65-67`
- **Problem:** `@fastify/rate-limit` returns 429 with a different response body when IP rate limit is exceeded. Design doc requires uniform 200 response for all outcomes (known/unknown/rate-limited).
- **Fix options:**
  - Configure `@fastify/rate-limit` to return 200 with the uniform message on this route
  - Use the `rateLimit` config with custom `errorResponseBuilder` that returns `{ message: 'If your email is registered, you will receive a reset link' }` with status 200
  - Alternatively, handle rate limiting in the service layer and remove IP rate-limit from the route config

#### 6. MAJOR — SMTP error mapping incomplete
- **File:** `apps/backend/src/modules/email/smtp.sender.ts:44-47`
- **Problem:** Reads `err.code` as a number, but nodemailer commonly exposes SMTP status as `responseCode` while `code` is often a string like `ECONNECTION`.
- **Fix:** Check both `responseCode` (for SMTP status codes like 421, 450) and `code` (string codes like `ECONNECTION`, `EAUTH`):
  ```ts
  interface NodemailerError {
    code?: string | number;
    responseCode?: number;
    message?: string;
  }
  const err = caught as NodemailerError;
  const smtpCode = typeof err.code === 'number' ? err.code : err.responseCode;
  const retriable = typeof smtpCode === 'number' && RETRIABLE_CODES.has(smtpCode);
  ```
  Also expand RETRIABLE_CODES and add TERMINAL_CODES.

#### 7. MAJOR — Observability requirements missing
- **Problem:** Design doc requires `email_send_total{outcome}`, `email_queue_depth` metrics and token-leak log alerting. Implementation has structured logs but no metrics counters/gauges.
- **Decision needed:** Whether to add metrics now (scope expansion) or note as future work. Design doc line 199-208 specifies these.

#### 8. MAJOR — Test strategy not fully implemented
- **Problem:** Design doc calls for API integration tests, worker tests with BullMQ+Redis mock, sender tests with jsonTransport, E2E full flow, and pinned invariants. Current tests cover only service units, minimal queue shape, minimal SMTP constructor, and template rendering.
- **Missing tests:** endpoint response parity, IP/email rate-limit behavior, worker retry/DLQ behavior, concurrent sibling-token invalidation, real SMTP send behavior.

---

## Additional Deviations Noted by Oracle

- `docs/forgot-password-design.md:240` calls for crypto helpers under shared code, but token generation/hashing is inlined in `password-reset.service.ts` (per user's explicit request to delete `crypto.ts`)
- `docs/forgot-password-design.md:271-272` calls for queue load testing and DLQ/SMTP credential rotation runbook — no runbook found
- `email.worker.ts:95-100` stores full `resetLink` including raw token in DLQ payload — may be unavoidable for queued delivery but DLQ retention of expired reset links should be reviewed

---

## Pre-push Gate Status

| Gate | Last Result |
|------|-------------|
| `pnpm format` | ✅ Clean |
| `pnpm lint` | ✅ All 5 packages pass |
| `pnpm check-types` | ✅ All 5 packages pass |
| `pnpm build` | ✅ All 5 packages build |
| Backend tests | ✅ 23/23 pass |
| Email-template tests | ✅ 5/5 pass |

---

## How to Continue

### Priority Order for Fixes

1. **Race condition (Issue #1)** — Most critical security bug. Write a Lua script for atomic token invalidation.
2. **Type-safety violations (Issue #2)** — Replace `as unknown as` casts with properly typed mock factories.
3. **Redis fail-fast (Issue #3)** — One-line fix: re-throw after logging.
4. **Email normalization (Issue #4)** — Add `.toLowerCase()` in service methods.
5. **Rate limit uniform response (Issue #5)** — Custom error response builder for `@fastify/rate-limit`.
6. **SMTP error mapping (Issue #6)** — Check both `responseCode` and `code`, expand code sets.
7. **Observability (Issue #7)** — Decision needed on scope.
8. **Test coverage (Issue #8)** — Decision needed on scope.

### Files to Modify

- `apps/backend/src/modules/auth/password-reset.service.ts` — Issues #1, #4
- `apps/backend/src/modules/auth/password-reset.service.test.ts` — Issue #2, add tests for #1 and #4
- `apps/backend/src/modules/email/email.service.test.ts` — Issue #2
- `apps/backend/src/plugins/redis.ts` — Issue #3
- `apps/backend/src/modules/auth/auth.router.ts` — Issue #5
- `apps/backend/src/modules/email/smtp.sender.ts` — Issue #6
- `apps/backend/src/modules/email/smtp.sender.test.ts` — Add tests for #6

### Commands to Verify After Fixes

```bash
pnpm format && pnpm lint && pnpm check-types && pnpm build
pnpm --filter backend test
pnpm --filter @chatz/email-template test
```