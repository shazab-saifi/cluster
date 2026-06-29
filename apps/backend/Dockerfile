FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS prepare
COPY . .
RUN bunx turbo prune backend --docker

FROM base AS builder
COPY --from=prepare /app/out/json .
COPY --from=prepare /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile --production

COPY --from=prepare /app/out/full .
RUN bunx turbo run db:generate --filter=@workspace/db
RUN bunx turbo run build --filter=backend

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S backend && adduser -S user -G backend
USER user

EXPOSE 4000

COPY --from=builder --chown=user:backend /app/apps/backend/dist ./dist
CMD ["bun", "dist/index.js"]
