# Forgot Password — Email Delivery Feature Design

> **Status:** Proposed · **Owner:** Backend  
> **Last updated:** 2026-05-05  
> **Priority order:** Security → Maintainability → Performance

---

## 0. Scope

Password reset flow: user requests reset link via email, clicks link, sets new password.

**Covers:** HTTP API, token lifecycle, email queue, SMTP sender, React Email templates, rate limiting, observability.  
**Out of scope:** Frontend reset page, password-strength UX, password history, additional email providers.

---

## 1. Threat Model

| Threat                     | Mitigation                                           |
| -------------------------- | ---------------------------------------------------- |
| Account enumeration        | Uniform 200 response; per-IP + per-email rate limits |
| Token brute force          | 32-byte CSPRNG (256 bits); SHA-256 hashed at rest    |
| Token replay               | Single-use; Redis `GETDEL` atomic consume            |
| Stale token reuse          | 15-min Redis TTL                                     |
| Multiple concurrent tokens | New request invalidates prior tokens for user        |
| Token leakage in logs      | Raw token never logged; only hash + userId           |
| Email-flood abuse          | Rate limits + exponential backoff                    |
| SMTP outage                | BullMQ retries + DLQ                                 |

---

## 2. High-Level Flow

1. **POST /api/forgot-password** → Validate rate limits → Generate token → Store in Redis → Enqueue email job → Return 200
2. **Worker** → Dequeue → Render email → Send via SMTP
3. **User clicks link** → Frontend captures token
4. **POST /api/reset-password** → Validate token (Redis `GETDEL`) → Hash new password → Update user → Return 204

---

## 3. Data Model

### Redis Keys

| Key                         | Type   | Value        | TTL   |
| --------------------------- | ------ | ------------ | ----- |
| `pw_reset:<sha256(token)>`  | String | userId       | 900s  |
| `pw_reset:user:<userId>`    | Set    | token hashes | 900s  |
| `rl:pw_reset:ip:<ip>`       | String | counter      | 60s   |
| `rl:pw_reset:email:<email>` | String | counter      | 3600s |

---

## 4. Email System

### 4.1 Interface

- `EmailSender.send(msg: EmailMessage): Promise<SendResult>`
- `SendError` with `retriable` boolean for BullMQ retry/DLQ logic

### 4.2 SMTP Implementation

- Nodemailer with connection pooling
- Maps SMTP error codes to retriable/terminal

### 4.3 Queue (BullMQ)

| Queue       | Job                    | Concurrency | Attempts      | Backoff              |
| ----------- | ---------------------- | ----------- | ------------- | -------------------- |
| `email`     | `password_reset_email` | 10          | 5             | exponential, 5s base |
| `email-dlq` | failed jobs            | -           | manual replay | -                    |

---

## 5. React Email Templates

### Package: `@chatz/email-template`

New workspace package for type-safe email templates.

**Structure:**

```
packages/email-template/
├── package.json
├── tsconfig.json
├── emails/
│   ├── password-reset.tsx
│   └── index.ts
└── components/
    ├── layout.tsx
    └── button.tsx
```

**Dependencies:**

- `@react-email/components`
- `@react-email/render`
- `react`, `react-dom`
- `react-email` (dev)

**Workflow:**

- `pnpm dev` → preview server at localhost:3001
- `pnpm build` → compile to dist/

### Template: PasswordResetEmail

- Props: `username`, `resetLink`, `expiresInMinutes`
- Tailwind styling
- Renders to HTML + plain text via `render()`

---

## 6. HTTP Surface

| Method | Path                 | Auth | Body                     | 2xx               |
| ------ | -------------------- | ---- | ------------------------ | ----------------- |
| POST   | /api/forgot-password | none | `{ email }`              | 200 `{ message }` |
| POST   | /api/reset-password  | none | `{ token, newPassword }` | 204               |

**Rate Limiting:**

- Layer 1: `@fastify/rate-limit` — 5 req/min/IP
- Layer 2: Redis counter — 3 req/hour/email

---

## 7. Module Layout

### Backend

```
apps/backend/src/
├── modules/
│   ├── auth/
│   │   ├── auth.router.ts
│   │   ├── auth.service.ts
│   │   ├── password-reset.service.ts
│   │   └── password-reset.types.ts
│   └── email/
│       ├── email.plugin.ts
│       ├── email.service.ts
│       ├── email.worker.ts
│       ├── smtp.sender.ts
│       └── types.ts
├── plugins/
│   └── redis.ts
└── shared/
    └── crypto.ts
```

### email-template

```
packages/email-template/
├── emails/
│   ├── password-reset.tsx
│   └── index.ts
└── components/
    ├── layout.tsx
    └── button.tsx
```

---

## 8. Reset URL Format

```
${FRONTEND_URL}/reset-password?token=<urlsafe-base64-token>
```

Token in query string (not fragment) for SPA compatibility. 15-min TTL mitigates log/referrer leakage.

---

## 9. Environment Variables

```
REDIS_URL=redis://redis:6379
FRONTEND_URL=https://chatz.example.com
EMAIL_FROM_NAME=Chatz
EMAIL_FROM_ADDRESS=no-reply@chatz.example.com

SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_SECURE=false

PASSWORD_RESET_TTL_SECONDS=900
PASSWORD_RESET_RATE_LIMIT_PER_EMAIL=3
PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS=3600
```

---

## 10. Observability

| Signal       | Implementation                           |
| ------------ | ---------------------------------------- |
| Reset events | Pino structured logs                     |
| SMTP metrics | `email_send_total{outcome}` counter      |
| Queue depth  | `email_queue_depth` gauge                |
| Token leak   | Log alert on `pw_reset:` + hex pattern   |
| Failed jobs  | Structured error log (no DLQ UI for now) |

---

## 11. Testing Strategy

**Outside-in TDD:** API → Worker → Sender → Templates → Helpers

**Layers:**

1. Unit: token gen/consume, error mapping, crypto helpers
2. Template: React Email render (HTML + plain text)
3. Sender: nodemailer with jsonTransport
4. Worker: BullMQ + ioredis-mock
5. API integration: testcontainers (Mongo + Redis)
6. E2E: MailHog + full flow

**Pinned invariants:**

- Uniform response body for known/unknown/rate-limited
- Token single-use enforcement
- Sibling token invalidation
- Retriable vs terminal error mapping
- Template renders valid HTML/plaintext

---

## 12. Implementation Phases

### Phase A — Foundations

- [ ] Add env vars to config schema and .env.example
- [ ] Add redis plugin
- [ ] Add crypto helpers
- [ ] Add MailHog/Mailpit to docker-compose.dev.yml

### Phase B — React Email + SMTP Sender

- [ ] Create `packages/email-template/` with React Email setup
- [ ] Add password-reset.tsx template
- [ ] Add `@chatz/email-template` workspace dep to backend
- [ ] Implement EmailSender interface + SendError
- [ ] Implement smtp.sender.ts with nodemailer
- [ ] Implement email.plugin.ts
- [ ] Implement email.service.ts (direct call, no queue; renders React Email via @react-email/render)
- [ ] Wire into auth.service.ts

### Phase C — Queue + Worker

- [ ] Add BullMQ queue + worker to email.plugin.ts
- [ ] Move email.service to queue.add()
- [ ] Configure retry/backoff; log failed jobs to console (no DLQ UI for now)

### Phase D — Public Endpoints

- [ ] POST /api/forgot-password handler
- [ ] POST /api/reset-password handler
- [ ] Add DTOs to @chatz/dto
- [ ] Integrate @fastify/rate-limit

### Phase E — Hardening

- [ ] Response parity tests
- [ ] Template rendering tests
- [ ] Load test queue path
- [ ] Runbook: DLQ drain, SMTP credential rotation

---

## Appendix: React Email Quick Reference

**Docs:** https://react.email/docs  
**Example:** https://github.com/resend/react-email-turborepo-pnpm-example

**Commands:**

```bash
pnpm --filter @chatz/email-template dev     # preview at :3001
pnpm --filter @chatz/email-template build   # compile
```
