import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import { findOrCreateUserByEmail } from '#/entities/user/server/repo.server'
import { toSessionUser } from '#/entities/user/model/types'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSession,
  destroySession,
} from '#/features/auth/lib/session.server'
import type { AuthEnv } from '#/features/auth/server/middleware'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const authRoute = new Hono<AuthEnv>()
  .get('/me', (c) => {
    const user = c.var.user
    return c.json({ user: user ? toSessionUser(user) : null })
  })
  .post('/login', async (c) => {
    const body = await c.req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: 'invalid_email' }, 400)
    }

    const user = await findOrCreateUserByEmail(email)
    const token = await createSession(user.id)

    setCookie(c, SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
      secure: process.env.NODE_ENV === 'production',
    })

    return c.json({ user: toSessionUser(user) })
  })
  .post('/logout', async (c) => {
    const token = getCookie(c, SESSION_COOKIE)
    if (token) await destroySession(token)
    deleteCookie(c, SESSION_COOKIE, { path: '/' })
    return c.json({ ok: true })
  })
