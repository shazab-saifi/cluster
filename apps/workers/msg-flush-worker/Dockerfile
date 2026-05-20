FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS runtime
RUN addgroup -S worker && adduser -S worker -G worker
USER worker

FROM base AS prepare
RUN bun install turbo@2.9.14 --global
COPY . .
RUN turbo prune msg-flush-worker --docker

FROM base AS builder
COPY --from=prepare /app/out/json .
COPY --from=prepare /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

COPY --from=prepare /app/out/full .
RUN bunx turbo run db:generate --filter=@workspace/db
RUN bunx turbo run worker:build --filter=msg-flush-worker
RUN bunx turbo run recovery:build --filter=msg-flush-worker

FROM runtime AS worker-runner
COPY --from=builder /app/apps/workers/msg-flush-worker/dist/worker.js ./dist/worker.js

CMD [ "bun", "dist/worker.js" ]

FROM runtime AS recovery-runner
COPY --from=builder /app/apps/workers/msg-flush-worker/dist/recovery-worker.js ./dist/recovery-worker.js

CMD [ "bun", "dist/recovery-worker.js" ]