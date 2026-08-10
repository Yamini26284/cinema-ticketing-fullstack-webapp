import { randomBytes } from 'node:crypto'

import { redis } from '#/db/redis'

export const SESSION_COOKIE = 'pensive_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

const keyFor = (token: string) => `session:${token}`

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(24).toString('hex')
  await redis.set(keyFor(token), String(userId), 'EX', SESSION_TTL_SECONDS)
  return token
}

export async function readSession(token: string): Promise<number | null> {
  const raw = await redis.get(keyFor(token))
  if (!raw) return null
  const userId = Number(raw)
  if (!Number.isInteger(userId)) return null
  // Sliding expiry: every authed request extends the session.
  await redis.expire(keyFor(token), SESSION_TTL_SECONDS)
  return userId
}

export async function destroySession(token: string): Promise<void> {
  await redis.del(keyFor(token))
}
