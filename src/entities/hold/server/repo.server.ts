import { and, eq, inArray, sql } from 'drizzle-orm'

import { db } from '#/db'
import { holds, seats, showings } from '#/db/schema'
import type { SeatMapItem } from '../model/types'
import { CapExceededError, HOLD_TTL_MS, HoldInvalidError, MAX_TICKETS_PER_SHOWING, SeatTakenError } from '../model/types'

export async function getSeatMap(showingId: number, currentUserId: number): Promise<SeatMapItem[]> {
  const [showing] = await db.select().from(showings).where(eq(showings.id, showingId))
  if (!showing) return []

  const rows = await db
    .select({
      id: seats.id,
      seatRow: seats.seatRow,
      seatNumber: seats.seatNumber,
      holdId: holds.id,
      holdStatus: holds.status,
      holdUserId: holds.userId,
      expiresAt: holds.expiresAt,
    })
    .from(seats)
    .leftJoin(
      holds,
      and(eq(holds.seatId, seats.id), eq(holds.showingId, showingId), inArray(holds.status, ['active', 'paid'])),
    )
    .where(eq(seats.room, showing.room))

  const now = Date.now()

  return rows.map((row) => {
    const isLiveHold =
      row.holdId != null &&
      (row.holdStatus === 'paid' || (row.expiresAt != null && row.expiresAt.getTime() > now))

    if (!isLiveHold) {
      return { id: row.id, seatRow: row.seatRow, seatNumber: row.seatNumber, status: 'available', holdId: null, expiresAt: null }
    }

    const status = row.holdStatus === 'paid' ? 'paid' : row.holdUserId === currentUserId ? 'mine' : 'held'
    return { id: row.id, seatRow: row.seatRow, seatNumber: row.seatNumber, status, holdId: row.holdId, expiresAt: row.expiresAt }
  })
}

// Creates holds for the requested seats in one transaction.
//
// No-double-sell guarantee: `holds_live_seat_unique` (a partial unique index
// on (showing_id, seat_id) where status in ('active','paid')) is enforced by
// Postgres itself, so even racing transactions from different processes can
// never both insert a live hold for the same seat — the loser gets a unique
// violation, not a wrong count.
//
// Per-customer cap: pg_advisory_xact_lock(showingId, userId) serializes only
// this user's concurrent requests for this showing, so two racing requests
// from the same customer can't both pass the count check before either
// commits. Different customers never contend on this lock.
export async function createHold(showingId: number, userId: number, seatIds: number[]) {
  if (seatIds.length === 0) throw new Error('seatIds must be non-empty')

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${showingId}, ${userId})`)

    // Lazily release any holds this customer (or others) let expire, so a
    // stale 'active' row doesn't block a fresh hold on the same seat.
    await tx
      .update(holds)
      .set({ status: 'expired' })
      .where(and(eq(holds.showingId, showingId), eq(holds.status, 'active'), sql`${holds.expiresAt} < now()`))

    const existing = await tx
      .select({ status: holds.status })
      .from(holds)
      .where(and(eq(holds.showingId, showingId), eq(holds.userId, userId), inArray(holds.status, ['active', 'paid'])))

    if (existing.length + seatIds.length > MAX_TICKETS_PER_SHOWING) {
      throw new CapExceededError(seatIds.length, existing.length)
    }

    const alreadyTaken = await tx
      .select({ seatId: holds.seatId })
      .from(holds)
      .where(
        and(eq(holds.showingId, showingId), inArray(holds.seatId, seatIds), inArray(holds.status, ['active', 'paid'])),
      )
    if (alreadyTaken.length > 0) {
      throw new SeatTakenError(alreadyTaken.map((r) => r.seatId))
    }

    const expiresAt = new Date(Date.now() + HOLD_TTL_MS)
    try {
      return await tx
        .insert(holds)
        .values(seatIds.map((seatId) => ({ showingId, seatId, userId, status: 'active', expiresAt })))
        .returning()
    } catch (err) {
      // Lost the race to a concurrent insert that committed between our
      // check above and this insert — the unique index caught it.
      if (isUniqueViolation(err)) throw new SeatTakenError(seatIds)
      throw err
    }
  })
}

// Drizzle wraps the underlying postgres error in a DrizzleQueryError,
// with the real pg error code on `.cause.code`, not on the error itself.
function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const cause = 'cause' in err ? err.cause : err
  return typeof cause === 'object' && cause !== null && 'code' in cause && (cause as { code?: string }).code === '23505'
}

// "Pay" at this API boundary just flips active holds to paid — there's no
// real payment provider. Confirms only holds owned by this user that are
// still active and unexpired; anything else is rejected with a specific
// reason so the client can tell "seat already gone" from "you don't own this".
export async function payHolds(userId: number, holdIds: number[]) {
  if (holdIds.length === 0) throw new Error('holdIds must be non-empty')

  return db.transaction(async (tx) => {
    // Sweep first so a hold whose TTL passed but hasn't been swept yet is
    // correctly reported as expired rather than silently paid.
    await tx
      .update(holds)
      .set({ status: 'expired' })
      .where(and(inArray(holds.id, holdIds), eq(holds.status, 'active'), sql`${holds.expiresAt} < now()`))

    const rows = await tx.select().from(holds).where(inArray(holds.id, holdIds))

    if (rows.length !== holdIds.length) {
      const foundIds = new Set(rows.map((r) => r.id))
      throw new HoldInvalidError(holdIds.filter((id) => !foundIds.has(id)), 'not_found')
    }
    const notOwned = rows.filter((r) => r.userId !== userId)
    if (notOwned.length > 0) throw new HoldInvalidError(notOwned.map((r) => r.id), 'not_owned')

    const alreadyPaid = rows.filter((r) => r.status === 'paid')
    if (alreadyPaid.length > 0) throw new HoldInvalidError(alreadyPaid.map((r) => r.id), 'already_paid')

    const notActive = rows.filter((r) => r.status !== 'active')
    if (notActive.length > 0) throw new HoldInvalidError(notActive.map((r) => r.id), 'expired')

    return tx
      .update(holds)
      .set({ status: 'paid', paidAt: sql`now()`, expiresAt: null })
      .where(inArray(holds.id, holdIds))
      .returning()
  })
}
