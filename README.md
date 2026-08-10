# Builders Technical Assessment

Welcome to the Builders Technical Assessment. This is a 50-minute AI-native coding assessment.

## What we evaluate

We care less about polish and more about correctness under realistic conditions. In particular, we look for:

- Correct handling of state transitions and failure cases
- Clear and reliable enforcement of business rules
- Thoughtful tradeoffs and explicit assumptions
- End-to-end product behavior that works in real user flows
- Ability to explain implementation decisions clearly

A working UI alone is not sufficient if core invariants can be violated through implementation details or edge cases.

You do not need production-scale infrastructure or pixel-perfect UI. We value correctness, clarity, and ownership over completeness.

## A note on AI usage:

You're encouraged to use AI tools throughout the assessment. We judge AI-generated code by the same standard as code you wrote yourself, so own everything that ships. Your full prompt history is captured by the remote environment automatically — you don't need to do anything to record it.

**Use only the AI tooling pre-installed in this remote environment.** Claude Code and Codex are already installed and ready to use — invoke those. Using any external AI application (e.g. ChatGPT, Claude.ai, Cursor, Copilot, or any tool outside this environment) is considered cheating and is grounds for disqualification, because it bypasses the prompt-history capture we rely on to evaluate your work. If you want AI help, ask the pre-installed Claude Code and Codex.

What matters most is that you understand and can clearly explain what you built: including the business logic, state transitions, tradeoffs, and implementation decisions behind your solution. We care far more about ownership and reasoning than whether code was AI-assisted.

## Background

We run a cinema that sells roughly 10,000 tickets a month. For major releases, seats can sell out within minutes. Right now, we lose money to scalpers buying up large blocks of seats.

We’d like you to design and build a ticketing system that handles this reliably.

## What it should do

- A customer can browse showings, hold seats for a screening, and pay to confirm the hold.
- Holds are temporary — if the customer doesn't pay in time, the seats go back into the pool.
- To prevent scalpers, a single customer can buy at most 7 tickets for any one showing — enforce this limit.
- Even if many customers race for the last seats, no seat is ever double-sold.

This is a full-stack assessment. We expect a thin but real UI — at minimum the screens a customer needs to see showings, pick seats, hold them, and pay. The box-office operator view is a bonus, not a requirement. We also care about practical engineering judgment: endpoint boundaries, error semantics, UI states, and interaction flows should feel thoughtful and realistic.

## What's yours to decide

- API shape: endpoints, request/response format, error model.
- Schema: how films, showings, seats, holds, payments, and customers relate.
- Hold semantics: how long a hold lives, how it's released, how renewal/cancellation works.
- How concurrency is enforced (the no-double-sell guarantee is on you).
- Payment is mocked — there is no real payment provider. Decide what "pay" means at the API boundary.
- The UI: which screens, what state they hold, how they react to seats being taken mid-flow.

For anything not specified above, decide freely and write down what you chose in the Trade-offs section.

## What we've given you in the starter repo

The plumbing is done so you can spend the 50 minutes on the actual ticketing problem. What's in place:

- **Auth flow (mock).** Email-only login: POST `/api/auth/login` with an email creates the user if it's new and sets an HttpOnly session cookie backed by Redis (7-day sliding expiry). `/api/auth/me`, `/api/auth/logout`, and a Hono middleware that hangs the current user on `c.var.user`. The `/login` and `/` pages are wired up — logged-out visits redirect to `/login`. **Not real auth; don't try to harden it.** It exists so the rest of the app can assume a current user.
- **`users` table.** `id`, `email` (unique), `name`, `created_at`.
- **`films` table.** `id`, `title`. The full domain schema is yours to design.
- **Seed data.** `pnpm db:seed` inserts two users (`alice@example.com`, `bob@example.com`) and five films so the login + list pages have something to show out of the box.
- **Frontend shell.** Feature-Sliced Design layout (`entities/`, `features/`, `widgets/`, `shared/`, `routes/`), Tailwind + shadcn/ui preconfigured, app shell with user/email + sign-out, films list on `/`.
- **Hono API + Drizzle (`postgres-js`).** `/api/health` is live and verifies both Postgres and Redis. An example Vitest test that hits `/api/health` passes out of the box.

What's **not** here (your job): showings, seat maps, holds, payments, the per-showing purchase cap, concurrency under contention.

## Remote environment

You're working inside a pre-provisioned remote environment. Already installed and running:

- **Node.js 22** + **pnpm**
- **Postgres 17** on `localhost:5432`
- **Redis 6** on `localhost:6379`
- This repo, with a working Hono + Vite setup, Drizzle config, mock auth + a tiny `users`/`films` schema, and one passing example test in `tests/`. A `/api/health` endpoint is live. Everything beyond auth + a film title list is yours to design.

## Stack

- TypeScript
- React (SPA via Vite)
- TanStack Router (file-based) + TanStack Query
- Hono (API server, runs on its own port)
- DrizzleORM with the **`postgres-js`** driver
- Postgres 17 and Redis 6
- Tailwind CSS + shadcn/ui (preconfigured; install components as needed)
- Vitest

## Run it

```bash
pnpm install
pnpm db:migrate        # applies the shipped users/films migration
pnpm db:seed           # inserts the two test users + five films
pnpm dev
```

When you extend the schema in `src/db/schema.ts`, run `pnpm db:generate` to produce a new migration, then `pnpm db:migrate` to apply it.

You can sign in as `alice@example.com` or `bob@example.com` — or any other email; new emails auto-create a user.

`pnpm dev` starts two processes:

- **web** — Vite dev server on `http://localhost:5173` (SPA + HMR, proxies `/api/*` to the API)
- **api** — Hono on `http://localhost:3001` (the only thing that talks to Postgres/Redis)

Defaults: `DATABASE_URL=postgres://postgres@localhost:5432/pensive`, `REDIS_URL=redis://localhost:6379`. Override via `.env.local` (see `.env.example`).

Verify the app is running:

```bash
curl http://localhost:5173/api/health   # via Vite proxy
curl http://localhost:3001/api/health   # directly against Hono (use this for concurrency tests)
```

Both should return `{"ok":true,"db":true,"redis":true}` once migrations have run.

## Test it

```bash
pnpm test
```

## Time and submission

You have **50 minutes** from when you start. When you're done (or when time is up), go to the top toolbar and click the **Submit** button in the menu. That bundles your code, this README, and your prompt history.

## How to preview your application

Click the play button in the top toolbar. This will preview your application in a new tab.

## Trade-offs you made

Write down any trade-offs you made here.
