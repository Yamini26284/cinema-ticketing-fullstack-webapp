# Getting Started

The remote environment we provide for the assessment already has **Postgres 17** on `localhost:5432` and **Redis 6** on `localhost:6379` running, with a `pensive` database pre-provisioned. There is no Docker setup.

Defaults baked into the starter:

- `DATABASE_URL=postgres://postgres@localhost:5432/pensive`
- `REDIS_URL=redis://localhost:6379`

Override via `.env.local` (see `.env.example`).

Install dependencies:

```bash
pnpm install
```

Generate and run migrations once you've defined a schema in `src/db/schema.ts`:

```bash
pnpm db:generate
pnpm db:migrate
```

Start the development servers:

```bash
pnpm dev
```

`pnpm dev` runs two processes in parallel via `concurrently`:

- **`web`** — Vite dev server on `http://localhost:5173`. Serves the SPA and proxies `/api/*` to the API server.
- **`api`** — Hono on `http://localhost:3001`. The only process that talks to Postgres/Redis.

If you only want one of them, run `pnpm dev:web` or `pnpm dev:api`.

Verify the starter app is running:

```bash
curl http://localhost:5173/api/health   # via Vite proxy
curl http://localhost:3001/api/health   # directly against Hono
```

Both should return `{"ok":true,"db":true,"redis":true}` once Postgres and Redis are healthy.

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

Tests can hit the Hono app three ways:

```ts
// 1. In-process — no port, no live dev server required
import app from '#/server'
const res = await app.fetch(new Request('http://x/api/health'))

// 2. Real HTTP against a programmatic server (good for concurrency tests)
import { serve } from '@hono/node-server'
const server = serve({ fetch: app.fetch, port: 0 })

// 3. Real HTTP against `pnpm dev`
await fetch('http://localhost:3001/api/health')
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling, plus [shadcn/ui](https://ui.shadcn.com) preconfigured for adding components on demand:

```bash
pnpm dlx shadcn@latest add button
```

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

## Routing

The frontend uses [TanStack Router](https://tanstack.com/router) with file-based routing. Page routes live in `src/routes/` and are codegen'd into `src/routeTree.gen.ts` by `@tanstack/router-plugin`.

## API server

The backend is a [Hono](https://hono.dev) app exported from `src/server/index.ts`. Routes live under `src/server/routes/` and are mounted on the `/api` base path. The Drizzle client (`#/db`) uses `postgres-js`; the Redis client (`#/db/redis`) uses `ioredis`.

## Project Structure

The app follows a Feature-Sliced Design style:

- `entities/` — domain-shaped UI models and components (e.g. `user`, `film`)
- `features/` — user actions and screens (e.g. `auth`, `films-list`)
- `widgets/` — larger page structure (the app shell lives here)
- `shared/` — reusable utilities, base UI primitives, and the `cn` helper
- `routes/` — file-based route components
- `server/` — the Hono API
- `db/` — Drizzle schema and Postgres/Redis clients
