import { Hono } from 'hono'

import { createHold, payHolds } from '#/entities/hold/server/repo.server'
import { CapExceededError, HoldInvalidError, SeatTakenError } from '#/entities/hold/model/types'
import type { AuthEnv } from '#/features/auth/server/middleware'

export const holdsRoute = new Hono<AuthEnv>()
  .post('/', async (c) => {
    if (!c.var.user) return c.json({ error: 'unauthorized' }, 401)

    const body = await c.req.json().catch(() => null)
    const showingId = Number(body?.showingId)
    const seatIds = Array.isArray(body?.seatIds) ? body.seatIds.map(Number) : null

    if (!Number.isInteger(showingId) || !seatIds || seatIds.length === 0 || seatIds.some((n: number) => !Number.isInteger(n))) {
      return c.json({ error: 'showingId and non-empty seatIds[] are required' }, 400)
    }

    try {
      const created = await createHold(showingId, c.var.user.id, seatIds)
      return c.json({ holds: created }, 201)
    } catch (err) {
      if (err instanceof SeatTakenError) {
        return c.json({ error: 'seat_taken', seatIds: err.seatIds }, 409)
      }
      if (err instanceof CapExceededError) {
        return c.json({ error: 'cap_exceeded', requested: err.requested, alreadyHeld: err.alreadyHeld }, 422)
      }
      throw err
    }
  })
  .post('/pay', async (c) => {
    if (!c.var.user) return c.json({ error: 'unauthorized' }, 401)

    const body = await c.req.json().catch(() => null)
    const holdIds = Array.isArray(body?.holdIds) ? body.holdIds.map(Number) : null
    if (!holdIds || holdIds.length === 0 || holdIds.some((n: number) => !Number.isInteger(n))) {
      return c.json({ error: 'non-empty holdIds[] is required' }, 400)
    }

    try {
      const paid = await payHolds(c.var.user.id, holdIds)
      return c.json({ holds: paid })
    } catch (err) {
      if (err instanceof HoldInvalidError) {
        return c.json({ error: err.reason, holdIds: err.holdIds }, err.reason === 'not_owned' ? 403 : 409)
      }
      throw err
    }
  })
