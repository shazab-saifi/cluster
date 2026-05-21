FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS prepare
RUN bun install turbo@2.9.14 --global
COPY . .
RUN turbo prune ws-backend --docker

FROM base AS install
COPY --from=prepare /app/out/json .
COPY --from=prepare /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

COPY --from=prepare /app/out/full .
RUN bunx turbo run db:generate --filter=@workspace/db

FROM install AS dev
ENV NODE_ENV=development
CMD [ "bun", "run", "dev" ]

FROM install AS builder
RUN bunx turbo run build --filter=ws-backend

FROM base AS runner
RUN addgroup -S realtime && adduser -S user -G realtime
USER user

ENV NODE_ENV=production
EXPOSE 8080
COPY --from=builder /app/apps/ws-backend/dist ./dist
CMD [ "bun", "dist/index.js" ]
