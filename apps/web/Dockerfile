FROM oven/bun:alpine AS base
RUN apk update && \
    apk add --no-cache libc6-compat

WORKDIR /app

FROM base AS prepare
RUN bun install turbo@2.9.14 as --global
COPY . .
RUN turbo prune web --docker

FROM base AS install
COPY --from=prepare /app/out/json .
COPY --from=prepare /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

FROM install AS dev
ENV NODE_ENV=development
CMD [ "bun", "run", "dev" ]

FROM install AS builder
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S bunjs && adduser -S nextjs -G bunjs
USER nextjs

COPY --from=builder --chown=nextjs:bunjs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:bunjs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:bunjs /app/apps/web/public ./apps/web/public

CMD [ "bun", "apps/web/server.js" ]