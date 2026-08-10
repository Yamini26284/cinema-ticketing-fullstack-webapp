import { db } from '#/db'
import { films } from '#/db/schema'

export async function listFilms() {
  return db.select({ id: films.id, title: films.title }).from(films)
}
