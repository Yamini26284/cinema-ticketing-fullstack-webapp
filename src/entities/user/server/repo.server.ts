import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { users } from '#/db/schema'

export async function findUserById(id: number) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return row ?? null
}

export async function findOrCreateUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1)
  if (existing) return existing

  const nameGuess = normalized.split('@')[0] || normalized
  const [created] = await db
    .insert(users)
    .values({ email: normalized, name: nameGuess })
    .returning()
  return created
}
