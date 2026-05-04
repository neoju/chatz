# chatz

A real-time chat and video calling application.

## Architecture

- **Frontend:** Svelte (compiled as a Single Page Application using `adapter-static`). Build artifacts are published to a shared Docker volume and served directly by Caddy — no separate web server container.
- **Backend:** Node.js + Fastify providing REST APIs and WebSocket connections (via `@fastify/websocket`). Mature ecosystem, first-class support for the MongoDB driver and all major SDKs.
- **Video Calling:** [Daily.co](https://daily.co) (managed WebRTC). Free tier covers 10,000 participant-minutes/month and up to 200 participants per room — plenty for early traction. The backend mints short-lived meeting tokens via the Daily REST API; the browser joins rooms with the official `@daily-co/daily-js` client SDK.
- **Database:** MongoDB for persistent storage.
- **Cache / State / Pub-Sub:** Redis for ephemeral data (online presence, socket routing, typing indicators) **and** as the cross-process pub/sub backbone for chat broadcasts.
- **Reverse Proxy + Static Server:** Caddy handles automatic SSL/HTTPS, reverse-proxies REST + WebSocket traffic to the backend, and serves the Svelte SPA directly from a shared volume. One container does the job of an edge proxy + static file server.
- **File Storage:** Google Cloud Storage (GCS) for handling image/attachment uploads via Pre-signed URLs (the Node `@google-cloud/storage` SDK is fully supported).
- **CI/CD:** GitHub Actions for automated deployment to the GCP VM (rolling update via `docker rollout` to avoid dropping live WebSockets).

## Features

- [ ] 1-on-1 private messaging
- [ ] Group chats (invitation only)
- [ ] 1-on-1 and Group Video Calling (powered by Daily.co)
- [ ] Email/Password authentication
- [ ] Full message history
- [ ] Image and file attachments
- [ ] Real-time typing indicators
- [ ] Read receipts
- [ ] Online presence

## Development Roadmap

See [docs/development-roadmap.md](docs/development-roadmap.md) for the full phased roadmap with checklists covering infrastructure, data modeling, backend, frontend, and CI/CD deployment.
