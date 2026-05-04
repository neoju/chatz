# Development Roadmap

## Phase 1: Infrastructure & Environment Setup
- [ ] **Initialize the Repository:** Set up a turborepo with `/frontend` and `/backend` directories.
- [ ] **Dockerize the Backend:** Create a multi-stage Node.js `Dockerfile` (`node:22-alpine` base) for the Fastify API + WebSocket server. Run as a non-root user.
- [ ] **Build the Frontend SPA:** Create a multi-stage `Dockerfile` for Svelte that builds the static SPA (`adapter-static`) inside a `node:22-alpine` builder stage and publishes the compiled `build/` output to a shared Docker volume. **No runtime web server in the frontend image** — Caddy serves the static files directly. The image's only job is producing build artifacts on container start, then exiting (or running a no-op `tail -f` for development hot-reload workflows).
- [ ] **Configure Caddy as the Single Edge + Static Server:** Write a `Caddyfile` that handles SSL, reverse-proxies `/api/*` and `/ws/*` to the backend, and serves the Svelte SPA directly from the shared volume (no internal Nginx hop). Key rules to avoid the common WebSocket footguns:
  - Use `http://` (not `ws://`) in the upstream address — Caddy auto-handles the `Upgrade` header; don't override it manually.
  - Add `read_timeout` / `write_timeout` for long-lived sockets.
  - Use `try_files {path} /index.html` for SPA client-side routing fallback (replaces SvelteKit's server-side `fallback: '200.html'` need).
  - Example block:
    ```caddyfile
    yourdomain.com {
        encode gzip zstd

        # WebSocket — Caddy auto-detects the Upgrade header.
        # Use http:// scheme; do NOT set X-Forwarded-* manually for ws.
        handle /ws/* {
            reverse_proxy http://backend:3000 {
                transport http {
                    read_timeout 24h
                    write_timeout 24h
                }
            }
        }

        # REST API
        handle /api/* {
            reverse_proxy http://backend:3000
        }

        # Static SPA (everything else) — served directly from shared volume
        handle {
            root * /srv/frontend
            try_files {path} /index.html
            file_server
        }
    }
    ```
- [ ] **Orchestrate with Docker Compose:** Write the `docker-compose.yml` to stitch together MongoDB, Redis, the Node backend, the frontend builder (publishes to a shared `frontend_dist` volume), and Caddy (mounts the same volume read-only at `/srv/frontend`). Caddy is the **only** web-facing container. Persistent volumes: `mongo_data`, `redis_data`, `caddy_data` (TLS certs), `frontend_dist`.

## Phase 2: Data Modeling (MongoDB & Redis)
- [ ] **User Schema:** Define the MongoDB schema for Users (email, hashed password, display name/avatar).
- [ ] **Conversation Schema:** Define the MongoDB schema for chats (`type: 'direct' | 'group'`, participants array, group name/admin, last message snippet, updated timestamp).
- [ ] **Message Schema:** Define the MongoDB schema for Messages (sender ID, conversation ID, text content, attachment URL, read status, timestamps).
- [ ] **Redis State Design:** Plan the Redis key-value structure:
  - `presence:{userId}` → `online` (TTL refreshed by heartbeat)
  - `socket:{userId}` → set of active socket IDs (for multi-tab support)
  - Pub/sub channels: `conv:{conversationId}` for fan-out of chat events across API instances.

## Phase 3: Backend API & WebSockets (Node.js + Fastify)
- [ ] **Project Setup:** Initialize Fastify with TypeScript, register `@fastify/cors`, `@fastify/jwt`, `@fastify/websocket`, `@fastify/multipart` (if needed), and a Pino logger config.
- [ ] **Authentication API:** Implement REST routes for email/password registration and login (bcrypt for hashing) returning a JSON Web Token via `@fastify/jwt`.
- [ ] **Data Fetching & Groups API:** Create REST routes to fetch conversation lists, paginated message history, create groups, and handle group invitations.
- [ ] **Video Calling Integration (Daily.co):**
  - Server: REST endpoint `POST /api/calls/:conversationId/token` that calls Daily's REST API to create or fetch a room and mint a short-lived meeting token (`exp` ~ 1 hour, scoped to that room and user).
  - Store the Daily room name on the conversation document so subsequent calls reuse the same room.
- [ ] **File Upload Integration:** Write the logic to generate Google Cloud Storage (GCS) V4 Pre-signed URLs using `@google-cloud/storage` for secure image/attachment uploads.
- [ ] **WebSocket Initialization:** Set up the WebSocket server with `@fastify/websocket`. Authenticate the connection by validating a short-lived JWT passed as the `?token=` query parameter at handshake (browsers can't send custom headers on `WebSocket`). Always serve over `wss://`.
- [ ] **Real-Time Event Handlers:** Implement WebSocket listeners/emitters using **Redis pub/sub** (via `ioredis`) for cross-process fan-out:
  - Routing private and group text messages.
  - Broadcasting "user is typing…" indicators in 1-on-1 and groups.
  - Broadcasting "message read" receipts.
  - Broadcasting "User A came online / went offline" using Redis presence keys.
  - Broadcasting video call ring/join events (the payload carries the Daily room name + token).

## Phase 4: Frontend Development (Svelte)
- [ ] **Project Setup:** Initialize the SvelteKit application using `adapter-static`. Set `fallback: '200.html'` and `export const ssr = false` in the root `+layout.js` so client-side routing works on refresh.
- [ ] **Auth Flow:** Build the Login/Register UI, handle API calls, and store the resulting JWT securely (httpOnly cookie preferred; if using `localStorage`, accept the XSS trade-off).
- [ ] **Svelte Stores for State:** Create reactive stores for:
  - The active WebSocket connection (with auto-reconnect + exponential backoff).
  - The currently active conversation (1-on-1 or group) and its message array.
  - The online/offline status of contacts.
  - Typing indicators.
- [ ] **Chat & Group Interface:** Build the layout (sidebar for conversations, main view for chat history, input bar, UI for creating groups and inviting users).
- [ ] **Video Call Interface:** Integrate `@daily-co/daily-js` (or `@daily-co/daily-svelte`-style wrapper). On "start call", request a token from `/api/calls/:id/token` and join the Daily room. Render the participant grid using Daily's prebuilt UI (`<DailyIframe>`) for fastest delivery, or build a custom layout using the call-object API later.
- [ ] **File Upload Flow:** Implement the UI to select a file, request a pre-signed URL from the backend, upload the file directly to GCS from the browser, and send the resulting URL through the WebSocket as a message.

## Phase 5: CI/CD & GCP Deployment
- [ ] **Provision VM:** Spin up a Google Compute Engine VM (`e2-small` is enough for early users — no SFU on-box). Install Docker and the Compose plugin. Install the `docker rollout` CLI plugin for zero-downtime rolling updates:
  ```bash
  mkdir -p ~/.docker/cli-plugins
  curl -sSL https://raw.githubusercontent.com/Wowu/docker-rollout/master/docker-rollout \
    -o ~/.docker/cli-plugins/docker-rollout
  chmod +x ~/.docker/cli-plugins/docker-rollout
  ```
- [ ] **Network Configuration:** Configure GCP firewall rules to allow external traffic on ports **80 (HTTP)** and **443 (HTTPS)** only. No UDP/WebRTC ports needed — Daily.co handles all media. Map your custom domain to the VM's static IP.
- [ ] **Production `docker-compose.yml` on VM:** Reference images from GHCR with a tag that the workflow overrides at deploy time, e.g. `image: ghcr.io/<org>/chatz/backend:${IMAGE_TAG:-latest}`. Each app service must declare a Docker `healthcheck:` — `docker rollout` waits for it before swapping traffic.
- [ ] **Backups:** Add a nightly `mongodump` cron container and Redis RDB snapshot, with both pushed to a GCS bucket via `gsutil`. Document and test the restore procedure.
- [ ] **GitHub Actions Workflow — Selective Build & Deploy:** Write `.github/workflows/deploy.yml` as a 3-job pipeline that **only rebuilds and redeploys apps whose code (or transitive shared-package deps) changed.** A README-only commit, or a change touching just `apps/frontend`, must not rebuild the backend image.

  **Job 1 — `detect`: Compute affected apps via Turborepo.**
  - `actions/checkout@v4` with `fetch-depth: 0` (shallow clones break ref comparison and force a full rebuild).
  - Run `turbo ls --affected --filter='./apps/*' --output=json` (Turbo `>= 2.8.21` — earlier 2.x has known `--affected` false-positive bugs: vercel/turborepo#11144, #10869).
  - Pass `TURBO_SCM_BASE=${{ github.event.before }}` and `TURBO_SCM_HEAD=${{ github.sha }}` so the diff base is correct on `push` events.
  - Output a JSON array `apps` and a boolean `has_changes` for downstream jobs. Turbo's dependency graph automatically marks `apps/backend` and `apps/frontend` as affected when `packages/shared` changes — no manual mapping needed.

  **Job 2 — `build`: Matrix build of only affected apps.**
  - Guard the whole job with `if: needs.detect.outputs.has_changes == 'true'` (an empty matrix is a hard error in GitHub Actions).
  - `strategy.matrix.app: ${{ fromJson(needs.detect.outputs.apps) }}` — one parallel build per affected app.
  - Each `apps/*/Dockerfile` should use `turbo prune <app> --docker` for a minimal build context.
  - Login to GHCR with `${{ secrets.GITHUB_TOKEN }}` (workflow needs `permissions: packages: write`).
  - Use `docker/build-push-action@v6` with **per-app GHA cache scope** (`cache-from: type=gha,scope=${{ matrix.app }}` and matching `cache-to`) so the frontend build doesn't invalidate the backend cache.
  - Tag images with both `type=sha` (immutable, used by deploy) and `latest` (used as compose fallback).

  **Job 3 — `deploy`: Rolling update of only changed services on the VM.**
  - Same `if: has_changes == 'true'` guard.
  - Add `concurrency: { group: deploy-prod, cancel-in-progress: false }` so a second push never aborts a running deploy.
  - SSH to the VM (key from `secrets.SSH_PRIVATE_KEY`, host pre-seeded into `known_hosts` via `ssh-keyscan`).
  - For each app in the affected list: `IMAGE_TAG=$SHA docker compose pull <app>` then `docker rollout <app> --timeout 120`. `docker rollout` honors the service's `healthcheck:` and exits non-zero if the new container fails to become healthy — the workflow step (and therefore the deploy) fails loudly with no half-rolled state.
  - Secrets (`MONGODB_URI`, `JWT_SECRET`, `DAILY_API_KEY`, `GCS_HMAC_KEY`, `GCS_HMAC_SECRET`, etc.) live in GitHub Secrets and are injected as environment variables read by `docker-compose.yml` on the VM — never baked into images.

  **Required GitHub Secrets:** `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, plus all runtime app secrets above.
