# Cluster — Project Agent Config

## What this project is

Cluster is a real-time messaging / chat platform (a Discord- or Slack-style app) built as a **Bun + Turborepo monorepo**. Users can:

- Create / join **networks** (servers) each with **channels** (text rooms)
- Send, edit, and delete **messages** in real time with optimistic UI updates
- Manage network membership with a role hierarchy (`OWNER > ADMIN > MODERATOR > MEMBER`)
- Add **friends** and send **friend requests** (request → accept / block, DM-style messaging over `friendshipId`)
- Create **invite links** for networks (limited use, expiring, revocable)
- Receive **notifications** (friend requests, mentions, reactions) in real time
- Sign in via **Google OAuth** or **email magic link** (better-auth + Resend)
- Upload avatars via **S3 presigned URLs** served through CloudFront

### Core message-durability flow (from README)

1. The client sends a message event and updates the UI optimistically.
2. The WebSocket backend appends the event to a **Redis Stream**, then broadcasts it to clients. If the append fails, it notifies the originating client that the message failed.
3. A worker consumes stream events and persists them according to type. DB failures are left **pending for retry** (in the stream's PEL).
4. A recovery worker reprocesses **pending entries (PEL)** from the Redis Stream.

`XADD` is the durability boundary: after a successful append, the system is responsible for preserving and processing the message.

## Tech stack & exact versions

### Tooling (root `package.json`)

- **Bun** `1.3.6` (package manager, `bun.lock` lockfile) · Node `>=20`
- **Turborepo** `2.9.14`
- **TypeScript** `5.9.3`
- **ESLint** `^9.39.2` (root & web; backend/ws-backend/workers resolve ESLint 10)
- **Prettier** `^3.8.1` + **prettier-plugin-tailwindcss** `^0.7.2`
- **husky** `^9.1.7`, **lint-staged** `^16.4.0`
- Workspaces: `apps/*`, `apps/*/*`, `packages/*`

### Apps

| App                                | Purpose                                        | Stack (declared)                                                                                                                                                                                                                                                                                                                                                                                           | Port |
| ---------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `apps/web`                         | Next.js frontend                               | **next** `16.1.6`, **react** / **react-dom** `^19.2.4`, **@tanstack/react-query** `^5.100.14`, **@tanstack/react-form** `^1.32.0`, **axios** `^1.17.0`, **better-auth** `^1.6.9`, **react-use-websocket** `^4.13.0`, **motion** `^12.39.0`, **sonner** `^2.0.7`, **next-themes** `^0.4.6`, **react-easy-crop** `^6.2.3`, **@phosphor-icons/react** `^2.1.10`, **lucide-react** `^1.11.0`, **zod** `^4.4.3` | 3000 |
| `apps/backend`                     | Express REST API                               | **express** `^5.2.1`, **cors** `^2.8.6`, **zod** `^4.3.6`                                                                                                                                                                                                                                                                                                                                                  | 4000 |
| `apps/ws-backend`                  | WebSocket server                               | **ws** `^8.20.0`, **zod** `^4.4.3`                                                                                                                                                                                                                                                                                                                                                                         | 8080 |
| `apps/workers/msg-flush-worker`    | Redis Stream → Postgres persister + recovery   | only `@workspace/redis`, `@workspace/core`                                                                                                                                                                                                                                                                                                                                                                 | —    |
| `apps/workers/notification-worker` | Redis Stream → Postgres notification persister | **zod** `^4.4.3` + workspace packages                                                                                                                                                                                                                                                                                                                                                                      | —    |

### Packages

| Package                        | Purpose                                                                                                   | Stack (declared)                                                                                                                                                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@workspace/core`              | Shared domain services (messages, networks, channels, friends, invites, notifications, s3) + error system | —                                                                                                                                                                                                                                                                    |
| `@workspace/db`                | Prisma client + schema + migrations + seed                                                                | **prisma** `^7.8.0`, **@prisma/client** `^7.8.0`, **@prisma/adapter-pg** `^7.8.0`, **pg** `^8.20.0`, **dotenv** `^17.4.2`; uses the `PrismaPg` driver adapter                                                                                                        |
| `@workspace/redis`             | Redis client / publisher / subscriber singletons                                                          | **redis** (node-redis) `^5.12.1`                                                                                                                                                                                                                                     |
| `@workspace/auth`              | better-auth config (Google + magic link), session helpers                                                 | **better-auth** `^1.6.9`, **resend** `^6.12.3`                                                                                                                                                                                                                       |
| `@workspace/aws`               | S3 client wrapper                                                                                         | **@aws-sdk/client-s3** `^3.1068.0`, **@aws-sdk/s3-request-presigner** `^3.1068.0`                                                                                                                                                                                    |
| `@workspace/ui`                | Shared shadcn/ui components, Tailwind v4 globals                                                          | **tailwindcss** `^4.1.18`, **radix-ui** `^1.4.3`, **shadcn** `^4.5.0`, **class-variance-authority** `^0.7.1`, **clsx** `^2.1.1`, **tailwind-merge** `^3.5.0`, **tw-animate-css** `^1.4.0`, **sonner** `^2.0.7`, **zod** `^3.25.76` (note: zod v3 here, v4 elsewhere) |
| `@workspace/eslint-config`     | Shared flat ESLint configs (`base`, `next-js`, `react-internal`)                                          | —                                                                                                                                                                                                                                                                    |
| `@workspace/typescript-config` | Shared tsconfigs (`base`, `nextjs`, `react-library`)                                                      | —                                                                                                                                                                                                                                                                    |

## Architecture

### Monorepo layout

```
cluster/
├── apps/
│   ├── backend/                 → Express REST API (port 4000); routes in apps/backend/routes/*, mounted by main.ts
│   ├── ws-backend/              → WebSocket server (port 8080)
│   ├── web/                     → Next.js 16 frontend (port 3000)
│   └── workers/
│       ├── msg-flush-worker/    → Redis Stream → Postgres persister + recovery worker
│       └── notification-worker/ → Redis Stream → Postgres notification persister
└── packages/
    ├── core/                    → shared domain services + error system (`export ./errors` and `./services/*`)
    ├── db/                      → Prisma client + schema + migrations + seed (generated client in packages/db/generated/prisma)
    ├── redis/                   → redisClient / publisher / subscriber singletons
    ├── auth/                    → better-auth config + session helpers
    ├── aws/                     → S3 client wrapper
    ├── ui/                      → shadcn/ui components, Tailwind v4 globals
    ├── eslint-config/           → shared flat ESLint configs
    └── typescript-config/       → shared tsconfigs
```

### Message delivery (realtime)

1. **Client** (`apps/web`) uses `react-use-websocket` and sends typed frames over `JOIN_CHANNEL`, `NEW_MESSAGE`, `EDIT_MESSAGE`, `DELETE_MESSAGE` (validated by a zod discriminated union in `apps/ws-backend/src/zod.schemas.ts`). The UI is updated **optimistically** by prepending messages into the react-query cache.
2. **ws-backend** authenticates the upgrade via `getSessionFromHeaders` (better-auth) and tracks per-socket channel membership in memory (`Map<channelId, Set<WebSocket>>`). For each message event it:
   - Appends to Redis Stream **`message:stream`** via `messages-services` (`XADD`, trimmed `MAXLEN ~ 10000`) — the durability boundary.
   - Publishes the broadcast payload to Redis Pub/Sub (channel keyed by `channelId`).
   - Sends a `SUCCESS` / `ERROR` frame back to the originating client with its `clientRequestId`.
3. A **Pub/Sub subscriber bridge** in ws-backend subscribes to per-channel Pub/Sub channels lazily (only after the first socket joins) and fans out to sockets in that channel.
4. **msg-flush-worker** reads `message:stream` via `XREADGROUP` (group `message-workers`, `COUNT 100`, `BLOCK 3000`). `NEW_MESSAGE` events are batched into an in-memory buffer and flushed to Postgres via `createManyMessages` after a **350ms** debounce or when the batch reaches **100**; only then are they `XACK`ed. `EDIT`/`DELETE` are applied immediately and ACKed. Any failure leaves the event **un-ACKed in the PEL**.
5. **recovery-worker** every **30s** runs `XAUTOCLAIM` on `message:stream` (`min idle 1000ms`), re-applies events, and ACKs successes → exactly-once-ish persistence.

### Notification delivery

1. REST routes (e.g., friend requests) call `createNotificationEvent` → `XADD` to **`notification:stream`** (group `notification-group`).
2. **notification-worker** reads the stream (`COUNT 10`, `BLOCK 5000`), validates with zod, persists via `createManyNotification`, publishes created notifications to the Redis Pub/Sub channel `notification.created`, then `XACK`s.
3. **ws-backend** subscribes to `persisted-notification-event` and pushes the notification to the socket whose `userId` matches `receiverId`.

### Data model (`packages/db/prisma/schema.prisma`, PostgreSQL)

- **Auth**: `User` (unique auto-generated `username`), `Session`, `Account`, `Verification`
- **Network** (PUBLIC/PRIVATE) → **NetworkMembers** (role enum `OWNER`/`ADMIN`/`MODERATOR`/`MEMBER`) → **Channel** (unique per network + name) → **Message** (indexes on `[channelId, createdAt DESC]` and `[friendshipId, createdAt DESC]`)
- **Friendship** (sender/receiver, status `PENDING`/`ACCEPTED`/`BLOCKED`, unique pair); a message targets `channelId` _or_ `friendshipId`
- **Invite** (token, maxUses/currentUses, expiresAt, revoked, role)
- **Notification** (type `FRIEND_REQUEST`/`MENTION`/`REACTION`, actor/user, optional entity + JSON `data`, unique `[actorId, userId]`, index `[userId, createdAt DESC]`)
- Migration history: 26 migrations (April 2026 → August 2026)

### REST API surface (`apps/backend/routes/`)

`GET /health` and all `/api/auth/*` (better-auth). Auth-gated (except invite preview): `/api/me`, `/api/networks` (+ `/:id`, `/search`, member search/roles/removal), `/api/channels/:channelId/messages`, `/api/friendship/:friendshipId/messages`, `/api/friendship` (+ `/add/:friendId`), `/api/invites` (+ `/:token`, plus public `GET /api/invites/:token` preview), `/api/generate-presigned-url`, `/api/notifications`, `/api/user/search`.

## Commands

All root commands go through Turbo:

```bash
bun install             # install deps
bun run dev             # turbo dev (web, backend, ws-backend persistent)
bun run build           # turbo build
bun run lint            # turbo lint
bun run format          # turbo format
bun run typecheck       # turbo typecheck (tsc --noEmit)
bun run worker:build    # msg-flush-worker → dist/worker.js (bun build --target node)
bun run recovery:build  # msg-flush-worker → dist/recovery-worker.js
```

Per-app dev / build:

```bash
# backend (port 4000)
AWS_PROFILE=cluster-s3-dev bun --bun --watch src/index.ts

# ws-backend (port 8080)
bun --watch src/index.ts

# web (port 3000)
next dev --turbopack

# msg-flush-worker
bun run --watch src/worker.ts            # dev
bun run --watch src/recovery-worker.ts   # recovery dev

# notification-worker
bun src/worker.ts   # dev
```

Database (`packages/db`):

```bash
bunx --bun prisma generate
bunx --bun prisma migrate dev
bunx --bun prisma migrate deploy
bun --env-file=.env --bun prisma db seed   # seeds a "Cluster" network with welcome channels/messages
```

## Testing

There are **no automated tests** in the repo yet (might be added in future). Quality gates are static only:

- `eslint` per app (root eslint config also uses `eslint-plugin-only-warn`)
- `tsc --noEmit` via `bun run typecheck` / per-app `check-types`
- **husky pre-commit** hook → `bunx lint-staged` → `prettier --write` + `eslint --fix` on staged JS/TS, prettier on json/md/css

## Conventions

- **Workspace packages** are consumed straight from `src/index.ts` (no build step; Bun/Next transpiles them). Builders differ per app: `notification-worker` builds with `tsc`; WS and msg-flush workers build with Bun's bundler.
- **Error handling**: `AppError` base class (`code`, `statusCode`, `status` `"fail"|"error"`, `suggestion`); concrete `BadRequestError`, `ValidationError`, `UnauthorizedError`, `NotFoundError`, `ForbiddenError`, `ResourceExpiredError`. `normalizeError()` maps Prisma (`P2002`, `P2003`, `P2011`, `P2025`, init/validation/rust-panic) and S3 errors into `AppError`. `sendErrorResponse()` returns a uniform shape: `{ success, status, statusCode, error: { code, message, timestamp, path, suggestion }, requestId }`.
- **Validation**: every request/response payload is validated with **zod**; schemas centralized in `apps/backend/lib/zod.schemas.ts` and `apps/ws-backend/src/zod.schemas.ts` (zod v4). ID params validated with `z.uuid()`.
- **Redis constants**: `MAX_BATCH_SIZE=100`, `FLUSH_DELAY_MS=350`, `RECOVERY_MIN_IDLE_MS=1000`, `RECOVERY_DELAY_MS=30000`; streams trimmed `MAXLEN ~ 10000`. Batch ACK only after DB success; failures stay in the PEL for the recovery worker.
- **Auth**: better-auth in `packages/auth` — Prisma adapter, Google OAuth + magic-link plugin (Resend, 5-min expiry), auto-generated unique `@username`, 7-day sessions. Express middleware and WS upgrade both use `getSessionFromHeaders`; `req.user` augmented via module declaration.
- **Frontend** (also see `apps/web/AGENTS.md`): never make a page itself a client component; use **react-query** for data fetching and **zustand** for global state; use **shadcn**, **tanstack forms**, and **zod**. Infinite message pagination via `useInfiniteQuery` (50/page) + `IntersectionObserver`. Realtime handled by `ChatSection` with `react-use-websocket`; `lastJsonMessage` switch directly mutates the react-query cache and `ERROR` frames surface a sonner toast.
- **Styling**: Tailwind v4 via `@tailwindcss/postcss`; CSS variables from `packages/ui/src/styles/globals.css`; shadcn `radix-nova` style aliased into `@workspace/ui`. Prettier: double quotes, semicolons, `tabWidth: 2`, `printWidth: 80`, trailing-comma es5, LF, tailwind plugin.
- **Docker**: multi-stage `FROM oven/bun:alpine` images using `bunx turbo prune <app> --docker`. Web uses Next standalone output. msg-flush-worker Dockerfile produces both `worker-runner` and `recovery-runner`.

## Environment variables (per workspace `.env` — committed)

- Common: `DATABASE_URL`, `REDIS_URL`, `NODE_ENV`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`
- Storage: `S3_BUCKET_NAME`, `CLOUDFRONT_URL`
- Also declared in `turbo.json` `globalEnv`

## TODO (implement only when told)

- **Consume `clientRequestId` on the client.** The web client already generates a `clientRequestId` per message send (`message-composer.tsx:28`, `messages-list.tsx:128,138`) and the ws-backend echoes it back in `SUCCESS` / `ERROR` frames (`ws-backend/index.ts` `sendSuccess`/`sendError`); however, `chat-section.tsx` currently ignores the echo — it only surfaces `ERROR` via a sonner toast. Implement request correlation keyed on `clientRequestId` (e.g. pending-request tracking / optimistic-UI rollback) when asked.

## Notes / caveats

- `.env` files containing real-looking credentials are committed in each app/package. Flag any change that might expose/rotate secrets.
- `apps/web` guidance mentions **zustand**, but no `zustand` dependency is declared in `apps/web/package.json` (or the lockfile) yet.
- `packages/ui` pins **zod v3** (`^3.25.76`) while the rest of the repo uses **zod v4**.
- Backend and ws-backend resolve **ESLint 10**; root and web use ESLint 9.
- No CI configuration exists in the repo.
