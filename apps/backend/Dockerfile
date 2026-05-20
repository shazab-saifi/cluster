FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS prepare
RUN bun install turbo@2.9.14 --global
COPY . .
RUN turbo prune backend --docker

FROM  base AS builder
COPY --from=prepare /app/out/json .
COPY --from=prepare /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

COPY --from=prepare /app/out/full .
RUN bunx turbo run db:generate --filter=@workspace/db
RUN bunx turbo run build --filter=backend

FROM base AS runner
RUN addgroup -S backend && adduser -S user -G backend
USER user

EXPOSE 4000
COPY --from=builder /app/apps/backend/dist ./dist
CMD [ "bun", "dist/index.ts" ]