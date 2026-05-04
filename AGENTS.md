# AGENTS.md — chatz

## Architecture

pnpm monorepo (Node ≥22, pnpm 10.33.2). Turbo orchestrates tasks.

- **`apps/backend`** — Fastify 5 (Node.js), tsc emits to `dist/`, dev via `tsx watch`
- **`apps/frontend`** — SvelteKit 2 + Svelte 5, `adapter-static` (SPA mode), dev via Vite on port 5173
- **`packages/eslint-config`** — shared ESLint 9 flat configs (`base`, `fastify`, `svelte`)
- **`packages/typescript-config`** — shared TS configs (`base`, `fastify`, `svelte`)

Infra: MongoDB 7, Redis 7 (pub/sub + presence), Caddy 2 (reverse proxy + static SPA + WebSocket), GCS for file uploads, Daily.co for video.

## Commands

| What      | Root                                | Per-app                                                    |
| --------- | ----------------------------------- | ---------------------------------------------------------- |
| Dev       | `pnpm dev`                          | `pnpm --filter backend dev` / `pnpm --filter frontend dev` |
| Build     | `pnpm build`                        | `pnpm --filter <app> build`                                |
| Lint      | `pnpm lint`                         | `pnpm --filter <app> lint`                                 |
| Typecheck | `pnpm check-types`                  | `pnpm --filter <app> check-types`                          |
| Format    | `pnpm format` / `pnpm format:check` | `pnpm --filter <app> format`                               |

Local services (Mongo + Redis): `make dev-docker` or `docker compose -f docker-compose.dev.yml up`.

**Pre-push gate** (all must pass, in order):

```sh
pnpm format && pnpm lint && pnpm check-types && pnpm build
```

**Frontend typecheck is not plain `tsc`** — it runs `svelte-kit sync && svelte-check`.

## Zero-Tolerance Quality Contract

Every line of code MUST pass lint, format, and typecheck with **zero suppressions**. CI rejects anything that doesn't.

### Forbidden

| Category            | Banned patterns                                                   |
| ------------------- | ----------------------------------------------------------------- |
| TS suppressions     | `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`          |
| ESLint suppressions | `// eslint-disable*`, `/* eslint-disable */`, file-level disables |
| Type escape hatches | `as any`, `as unknown as T`, `: any` annotations                  |
| Test failures       | Disabling tests, deleting assertions, commenting out broken code  |

`ban-ts-comment` is set to `minimumDescriptionLength: 9999` — no description satisfies it. Intentional.

`no-explicit-any` and all `no-unsafe-*` rules are `error`. Untyped values do not cross module boundaries.

## Shared Config

App tsconfigs extend **only** `@chatz/typescript-config/*`. App eslint configs import **only** `@chatz/eslint-config/*`. Never fork shared configs into an app. Change rules in `packages/` so every app gets the update.

### Config details

**ESLint** (`packages/eslint-config/`):

- `base.js` — strict typed-linting, `ban-ts-comment`, `no-explicit-any`, full `no-unsafe-*` suite, promise hygiene (`no-floating-promises`, `no-misused-promises`, `await-thenable`, `require-await`)
- `fastify.js` — adds Node globals, relaxes `require-await` and `misused-promises` for async handlers
- `svelte.js` — adds Svelte parser + browser globals + `eslint-plugin-svelte/flat/recommended`, relaxes some `no-unsafe-*` in `.svelte` files

**TypeScript** (`packages/typescript-config/`):

- `base.json` — `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `useUnknownInCatchVariables`
- `fastify.json` — extends base, adds `@types/node`, `NodeNext` modules
- `svelte.json` — extends base, `ESNext` + DOM libs, bundler resolution, `allowJs`/`checkJs`

## Routing (Caddy)

- `/ws/*` → WebSocket proxy to backend (24h timeouts)
- `/api/*` → reverse proxy to backend
- `/*` → SPA static files from `/srv/frontend` (fallback to `200.html`)
