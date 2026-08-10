import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { films, showings } from '#/db/schema'

export async function listShowings() {
  return db
    .select({
      id: showings.id,
      room: showings.room,
      startsAt: showings.startsAt,
      filmId: films.id,
      filmTitle: films.title,
    })
    .from(showings)
    .innerJoin(films, eq(showings.filmId, films.id))
}

export async function findShowingById(id: number) {
  const [showing] = await db.select().from(showings).where(eq(showings.id, id))
  return showing ?? null
}
