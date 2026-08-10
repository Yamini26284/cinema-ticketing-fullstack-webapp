import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { db, sql } from '#/db'
import { films, holds, seats, showings, users } from '#/db/schema'
import { CapExceededError, MAX_TICKETS_PER_SHOWING, SeatTakenError } from '../model/types'
import { createHold, payHolds } from './repo.server'

const ROOM = `concurrency-test-room-${Date.now()}`

let showingId: number
let seatIds: number[]
let userIds: number[]

beforeAll(async () => {
  const [film] = await db.insert(films).values({ title: 'Concurrency Test Film' }).returning()

  const insertedSeats = await db
    .insert(seats)
    .values(Array.from({ length: 20 }, (_, i) => ({ room: ROOM, seatRow: 'Z', seatNumber: i + 1 })))
    .returning()
  seatIds = insertedSeats.map((s) => s.id)

  const [showing] = await db.insert(showings).values({ filmId: film.id, room: ROOM, startsAt: new Date() }).returning()
  showingId = showing.id

  const insertedUsers = await db
    .insert(users)
    .values(Array.from({ length: 14 }, (_, i) => ({ email: `race-test-${Date.now()}-${i}@example.com`, name: `Racer ${i}` })))
    .returning()
  userIds = insertedUsers.map((u) => u.id)
})

afterAll(async () => {
  await db.delete(holds).where(eq(holds.showingId, showingId))
  await db.delete(showings).where(eq(showings.id, showingId))
  await db.delete(seats).where(eq(seats.room, ROOM))
  for (const userId of userIds) {
    await db.delete(users).where(eq(users.id, userId))
  }
  await sql.end()
})

describe('no-double-sell under concurrency', () => {
  it('lets exactly one of many concurrent requests win a single seat', async () => {
    const contestedSeat = seatIds[0]
    const racers = userIds.slice(0, 10)

    const results = await Promise.allSettled(
      racers.map((userId) => createHold(showingId, userId, [contestedSeat])),
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled')
    const failed = results.filter((r) => r.status === 'rejected')

    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(racers.length - 1)
    for (const f of failed) {
      expect((f as PromiseRejectedResult).reason).toBeInstanceOf(SeatTakenError)
    }

    const liveHolds = await db
      .select()
      .from(holds)
      .where(eq(holds.seatId, contestedSeat))
    expect(liveHolds.filter((h) => h.status === 'active' || h.status === 'paid')).toHaveLength(1)
  })
})

describe('per-customer 7-ticket cap under concurrency', () => {
  it('never lets one customer end up holding more than the cap, even with racing requests', async () => {
    const capUser = userIds[10]
    const capSeats = seatIds.slice(1, 17) // 16 seats, way over the cap of 7
    const chunks = [
      capSeats.slice(0, 2),
      capSeats.slice(2, 4),
      capSeats.slice(4, 6),
      capSeats.slice(6, 8),
      capSeats.slice(8, 10),
      capSeats.slice(10, 12),
      capSeats.slice(12, 14),
      capSeats.slice(14, 16),
    ]

    const results = await Promise.allSettled(chunks.map((chunk) => createHold(showingId, capUser, chunk)))

    const succeeded = results.filter((r) => r.status === 'fulfilled')
    const failed = results.filter((r) => r.status === 'rejected')
    expect(failed.length).toBeGreaterThan(0)
    for (const f of failed) {
      expect((f as PromiseRejectedResult).reason).toBeInstanceOf(CapExceededError)
    }

    const liveHolds = await db.select().from(holds).where(eq(holds.userId, capUser))
    const liveCount = liveHolds.filter((h) => h.status === 'active' || h.status === 'paid').length
    expect(liveCount).toBeLessThanOrEqual(MAX_TICKETS_PER_SHOWING)
    expect(liveCount).toBe(succeeded.reduce((sum, r) => sum + (r as PromiseFulfilledResult<unknown[]>).value.length, 0))
  })
})

describe('pay lifecycle', () => {
  it('rejects paying an expired hold and frees the seat for someone else', async () => {
    const [payer, otherUser] = userIds.slice(-2)
    const seatId = seatIds[19]

    const [hold] = await createHold(showingId, payer, [seatId])
    await db.update(holds).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(holds.id, hold.id))

    await expect(payHolds(payer, [hold.id])).rejects.toThrow()

    const rehold = await createHold(showingId, otherUser, [seatId])
    expect(rehold).toHaveLength(1)
  })

  it('rejects double-paying the same hold', async () => {
    const seatId = seatIds[18]
    const [hold] = await createHold(showingId, userIds[5], [seatId])
    await payHolds(userIds[5], [hold.id])
    await expect(payHolds(userIds[5], [hold.id])).rejects.toThrow()
  })
})
