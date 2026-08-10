import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'

import { findUserById } from '#/entities/user/server/repo.server'
import type { User } from '#/db/schema'

import { SESSION_COOKIE, readSession } from '../lib/session.server'

type AuthVariables = {
  user: User | null
}

// Attaches the current user (or null) to every request. Routes that need
// a logged-in user should check `c.var.user` and return 401 themselves —
// keeping the gate in route handlers makes the auth boundary easy to see.
export const sessionMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE)
    if (!token) {
      c.set('user', null)
      return next()
    }
    const userId = await readSession(token)
    const user = userId ? await findUserById(userId) : null
    c.set('user', user)
    return next()
  },
)

export type AuthEnv = { Variables: AuthVariables }
