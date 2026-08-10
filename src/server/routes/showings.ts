import { Hono } from 'hono'

import { getSeatMap } from '#/entities/hold/server/repo.server'
import { listShowings } from '#/entities/showing/server/repo.server'
import type { AuthEnv } from '#/features/auth/server/middleware'

export const showingsRoute = new Hono<AuthEnv>()
  .get('/', async (c) => {
    if (!c.var.user) return c.json({ error: 'unauthorized' }, 401)
    const showings = await listShowings()
    return c.json({ showings })
  })
  .get('/:id/seats', async (c) => {
    if (!c.var.user) return c.json({ error: 'unauthorized' }, 401)
    const showingId = Number(c.req.param('id'))
    if (!Number.isInteger(showingId)) return c.json({ error: 'invalid showing id' }, 400)
    const seats = await getSeatMap(showingId, c.var.user.id)
    return c.json({ seats })
  })
