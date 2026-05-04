# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

FROM base AS prepare
COPY . .
RUN pnpm dlx turbo@2.9.0 prune frontend --docker

FROM base AS builder
COPY --from=prepare /app/out/json/ ./
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=prepare /app/out/full/ ./
RUN pnpm --filter frontend run build

FROM alpine:3.20 AS publisher
RUN apk add --no-cache rsync
COPY --from=builder /app/apps/frontend/build /build
CMD ["sh", "-c", "rsync -a --delete /build/ /srv/frontend/ && tail -f /dev/null"]
