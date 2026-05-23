FROM oven/bun:alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

FROM base AS prepare
COPY . .
RUN bunx turbo prune web --docker

FROM base AS builder
COPY --from=prepare /app/out/json .
COPY --from=prepare /app/out/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

COPY --from=prepare /app/out/full .
RUN bunx turbo run build --filter=web

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S bunjs && adduser -S nextjs -G bunjs
USER nextjs

EXPOSE 3000

COPY --from=builder --chown=nextjs:bunjs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:bunjs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:bunjs /app/apps/web/public ./apps/web/public

CMD ["bun", "apps/web/server.js"]
