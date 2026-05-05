# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file is scoped to `apps/backend`. Monorepo-wide rules (the **Zero-Tolerance Quality Contract**, shared ESLint/TS configs, pre-push gate) live in `../../AGENTS.md` at the repo root — read that first.

## Commands

Run from the repo root unless noted. Backend uses ESM (`"type": "module"`) and Node ≥22.

| Task         | Command                               |
| ------------ | ------------------------------------- |
| Dev (watch)  | `pnpm --filter backend dev`           |
| Build (tsc)  | `pnpm --filter backend build`         |
| Typecheck    | `pnpm --filter backend check-types`   |
| Lint         | `pnpm --filter backend lint`          |
| Start (prod) | `pnpm --filter backend start`         |
| Local infra  | `make dev-docker` (Mongo 7 + Redis 7) |

There is no test runner wired up yet — `make test` from the project memory hint is aspirational.

Dev runs via `tsx watch src/server.ts`. Production runs the tsc-emitted `dist/` with `tsconfig-paths/register` to resolve the `@/*` path alias at runtime.

## Required env

`apps/backend/.env` (or process env) must define `MONGO_URI` and `JWT_SECRET`. `PORT` (default `3000`) and `HOST` (default `0.0.0.0`) are optional. Validation happens at startup via `@fastify/env` — missing required vars exit the process.

## Architecture

### Server bootstrap (`src/server.ts`)

Top-level await is used. Plugin order matters:

1. `configEnv` — must run first (and is **awaited**, not just registered) so `app.config` is populated before other plugins read it.
2. `mongoose` plugin — connects to MongoDB; registers an `onClose` hook to disconnect.
3. `providerZod` — installs Zod validator/serializer compilers and Swagger UI at `/api/docs`.
4. Routers register under `/api`. Protected routes go inside an inner `register(async (app) => { await app.register(authMiddleware); … })` scope so the `preHandler` JWT check only applies to that subtree (e.g. `/api/users/*`). Public routes (`/api/login`, `/api/register`) sit outside that scope.

The Fastify instance is built with `.withTypeProvider<ZodTypeProvider>()` — route schemas pass Zod schemas directly (not JSON Schema objects), and types flow from those schemas.

### Module convention (`src/modules/<name>/`)

Each module is a folder with three files:

- `*.schema.ts` — Mongoose model definition, exports both the `IUser`-style TS interface and the model.
- `*.service.ts` — business logic. Two patterns coexist; **prefer the factory pattern** when the service needs `app` (config, logger): `export default (app: FastifyInstance) => ({ … })`. Use plain `export async function` only for stateless helpers.
- `*.router.ts` — `export default function fooRouter(app: FastifyInstance) { … }`. Instantiates the service with `const service = authService(app)` when applicable. Route schemas import Zod schemas from `@chatz/dto`.

When wiring a new module into `server.ts`, decide whether it requires auth and place the `app.register(router, { prefix: … })` inside or outside the auth-protected inner scope accordingly.

### Plugins vs middlewares

- `src/plugins/` — wrapped in `fp(...)` (or registered via `await fastify.register(...)`); decorate the app with capabilities (config, DB, validation).
- `src/middlewares/` — also `fp(...)`-wrapped, but install request-scoped hooks. `auth.ts` adds a `preHandler` hook that verifies `Authorization: Bearer <jwt>` against `app.config.JWT_SECRET` and decorates `request.user` with the `JWTPayload`. The `declare module 'fastify'` block extends `FastifyRequest` with the optional `user` field.

### Path alias

`@/*` → `./src/*` is configured in `tsconfig.json`. Always use it in imports. Imports include the `.js` extension (NodeNext ESM resolution) — e.g. `import authService from './auth.service.js'`, even though the file is `.ts`. This is non-negotiable; ESM Node won't resolve extensionless imports at runtime.

### DTOs and shared types

- `@chatz/dto` — Zod schemas (using `zod/v4` import path) **and** their inferred types. The single source of truth for request/response contracts shared between backend and frontend. Any new endpoint defines its schemas here, not inline in the router.
- `@chatz/shared` — runtime constants and enums shared across apps (e.g. `UserStatus`).

Both packages are workspace dependencies (`workspace:*`) and emit to `dist/` via `tsc`. Turbo's `^build` ensures they are built before backend builds — but **dev mode (`tsx watch`) does not trigger the cascade**, so after editing a shared package, run `pnpm --filter @chatz/dto build` (or `@chatz/shared`) for the backend to pick up the change. Or run `pnpm dev` from root, which builds dependencies first via Turbo.

### Mongoose patterns

`User` schema uses `timestamps: true` (auto `createdAt`/`updatedAt`). The `UserStatus` enum is sourced from `@chatz/shared` and applied via `enum: Object.values(UserStatus)`. New schemas should follow the same `IFoo` interface + `mongoose.model<IFoo>('Foo', schema)` pattern, and import enums from `@chatz/shared` rather than defining them locally.

### Auth flow

Service-level errors (`throw new Error('Bad request')`) are not currently mapped to HTTP status codes — Fastify defaults to 500. When tightening this, prefer `throw app.httpErrors.badRequest(...)` (would require `@fastify/sensible`) or return error payloads from the route handler. JWTs are signed HS256 with `expiresIn: '7d'`.

## Routing surface

- Public: `POST /api/login`, `POST /api/register`, `POST /api/forgot-password` (stub), `GET /health`.
- Protected (Bearer JWT): `GET /api/users/me`.
- OpenAPI: `/api/docs` (Swagger UI), generated from Zod schemas via `fastify-type-provider-zod`.
