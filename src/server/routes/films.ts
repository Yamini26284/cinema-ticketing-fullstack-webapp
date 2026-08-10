import { Hono } from 'hono'

import { listFilms } from '#/entities/film/server/repo.server'
import type { AuthEnv } from '#/features/auth/server/middleware'

export const filmsRoute = new Hono<AuthEnv>().get('/', async (c) => {
  if (!c.var.user) return c.json({ error: 'unauthorized' }, 401)
  const films = await listFilms()
  return c.json({ films })
})
