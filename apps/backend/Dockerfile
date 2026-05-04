# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

FROM base AS prepare
COPY . .
RUN pnpm dlx turbo@2.9.0 prune backend --docker

FROM base AS builder
COPY --from=prepare /app/out/json/ ./
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=prepare /app/out/full/ ./
RUN pnpm --filter backend run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=prepare /app/out/json/ ./
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
USER node
WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/server.js"]
