FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS prepare
COPY . .
RUN bunx turbo prune ws-backend --docker

FROM base AS builder
COPY --from=prepare /app/out/json .
COPY --from=prepare /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

COPY --from=prepare /app/out/full .
RUN bunx turbo run db:generate --filter=@workspace/db
RUN bunx turbo run build --filter=ws-backend

FROM base AS runner
RUN addgroup -S realtime && adduser -S user -G realtime
USER user

ENV NODE_ENV=production
EXPOSE 8080
COPY --from=builder /app/apps/ws-backend/dist ./dist
CMD ["bun", "dist/index.js"]
