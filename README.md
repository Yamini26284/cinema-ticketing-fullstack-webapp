# Cinema Ticketing

A full-stack ticketing system for a cinema that sells ~10,000 tickets a month. For major releases, seats can sell out within minutes, and a small number of buyers grabbing large blocks (scalpers) makes that worse for everyone else.

This project builds the core booking flow — browse showings, hold seats, pay to confirm — with two guarantees that hold even under heavy concurrent load:

- **No seat is ever double-sold**, even when many customers race for the same last seats.
- **No customer can hold more than 7 tickets for a single showing**, even across multiple simultaneous requests.

## What's implemented

- **Showings & seat maps.** Browse scheduled showings, see a live seat map per showing (available / held by someone else / held by you / paid).
- **Holds.** Selecting seats creates a temporary hold with a 5-minute expiry. Unpaid holds automatically become available again once they expire — no cron job, expiry is checked lazily wherever it matters (reading the seat map, attempting to pay, creating a new hold).
- **Pay.** Confirms a hold into a paid ticket. Payment itself is mocked (no real payment provider) — "pay" is a state transition from `active` → `paid`, guarded so you can't pay someone else's hold, pay twice, or pay a hold that already expired.
- **Per-customer cap.** At most 7 live (held or paid) tickets per customer per showing, enforced at the database transaction level, not just checked in application code.
- **Concurrency safety.** Verified with an integration test suite that fires real concurrent requests at Postgres (not mocked) and asserts the invariants hold.
- **Mock auth (pre-existing scaffold).** Email-only login — not real authentication, just enough to have a "current user" for the rest of the app to build on.

Not implemented: a box-office/operator view (out of scope for this pass — the customer flow was the priority).

## How the concurrency guarantees work

The interesting engineering problem here isn't the CRUD — it's making the two invariants above hold when dozens of requests hit the same seat or the same customer's cap at the same instant.

**No-double-sell — enforced by the database, not application logic.**
`holds` has a partial unique index:

```sql
CREATE UNIQUE INDEX "holds_live_seat_unique"
  ON "holds" ("showing_id", "seat_id")
  WHERE status IN ('active', 'paid');
```

Only one *live* hold (active or paid) can ever exist for a given seat on a given showing. Two transactions racing to insert a hold for the same seat can't both commit — Postgres rejects the second with a `23505` unique-violation error, which the app catches and turns into a clean `409 seat_taken` response. This is stronger than an app-level "check if taken, then insert" — that pattern is inherently racy without a DB constraint backing it, because both requests can pass the check before either commits.

**7-ticket cap — enforced with a per-customer advisory lock.**
The cap requires counting a customer's existing holds and rejecting if adding more would exceed 7 — but count-then-insert is racy on its own for the same reason as above. Each hold-creation transaction takes `pg_advisory_xact_lock(showingId, userId)` before counting, which serializes only *that customer's* concurrent requests for *that showing*. Two different customers, or the same customer on a different showing, never contend on this lock, so it doesn't bottleneck the showing as a whole even during a sellout — only a customer racing against themselves gets serialized.

Both mechanisms are covered by integration tests (`src/entities/hold/server/concurrency.test.ts`) that fire real concurrent requests (via `Promise.allSettled`) at the live database and assert exactly one winner / exactly the cap survives.

## Stack

- TypeScript
- React (SPA via Vite) + TanStack Router + TanStack Query
- Hono (API server)
- Drizzle ORM (`postgres-js` driver)
- Postgres 17, Redis 6
- Tailwind CSS + shadcn/ui
- Vitest

## Run it

```bash
pnpm install
pnpm db:migrate
pnpm db:seed        # two test users + five films + a seeded room/showings
pnpm dev
```

`pnpm dev` starts two processes:

- **web** — Vite dev server on `http://localhost:5173` (proxies `/api/*` to the API)
- **api** — Hono on `http://localhost:3001` (the only thing that talks to Postgres/Redis)

Sign in with `alice@example.com` or `bob@example.com` (or any email — new ones auto-create a user).

Defaults: `DATABASE_URL=postgres://postgres@localhost:5432/pensive`, `REDIS_URL=redis://localhost:6379`. Override via `.env.local`.

## Test it

```bash
pnpm test
```

Includes integration tests that exercise the no-double-sell and per-customer-cap guarantees under real concurrent load against Postgres.

## Design notes & trade-offs

- **A paid hold doubles as the ticket.** No separate `tickets` table — `holds.status = 'paid'` plus `paidAt` is the ticket record. Simpler schema; a system that needed refunds, transfers, or check-in would likely split these once tickets need their own lifecycle.
- **Hold expiry is lazy, not cron-driven.** Liveness is computed from `expiresAt` at read time and opportunistically swept to `expired` within the same transaction wherever a hold is touched (seat map read, pay attempt, new hold creation). Simpler than a background job, and it can't race with a real payment since `payHolds` re-checks `expiresAt` itself before confirming.
- **5-minute hold TTL** — a reasonable window to enter payment details; not derived from any specific requirement.
- **Seats are shared across showings in the same room**, not duplicated per showing. A showing's seat map is a join of `seats` (scoped by room) against live holds for that specific `showingId`.
- **Frontend polls the seat map every 4 seconds** rather than pushing updates over websockets/SSE, to keep other customers' seat selections visible without extra infrastructure. Good enough at this scale; push-based updates would be the next step if that polling interval ever felt stale under real load.
- **No idempotency keys on payment.** Since payment is mocked and there's no real provider to reconcile against, the pay endpoint just relies on the hold's own state machine (`active` → `paid`, rejecting repeats) rather than a separate idempotency layer.

## Built with AI assistance

This project was built with Claude Code as a pair-programming tool — used for implementation, running concurrency tests against a live Postgres instance to verify the invariants above, and catching a real bug in the process (an error-unwrapping mismatch that would have surfaced as an unhandled 500 instead of a clean `409` under genuine database contention, found by writing and running the integration tests rather than by inspection).
