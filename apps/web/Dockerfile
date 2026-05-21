FROM oven/bun:alpine AS base
RUN apk update &&
RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN addgroup -S bunjs && adduser -S nextjs -G bunjs
RUN chown nextjs:bunjs /app
USER nextjs

FROM base AS prepare
RUN bun install turbo@2.9.14 --global
COPY --chown=nextjs:bunjs . .
RUN turbo prune web --docker

FROM base AS installer
COPY --from=prepare --chown=nextjs:bunjs /app/out/json .
COPY --from=prepare --chown=nextjs:bunjs /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

COPY --from=prepare --chown=nextjs:bunjs /app/out/full .

FROM installer AS dev
ENV NODE_ENV=development
CMD [ "bun", "run", "dev" ]

FROM installer AS builder
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder --chown=nextjs:bunjs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:bunjs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:bunjs /app/apps/web/public ./apps/web/public

CMD [ "bun", "apps/web/server.js" ]