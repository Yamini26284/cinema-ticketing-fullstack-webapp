import { db, sql } from './index.ts'
import { films, seats, showings, users } from './schema.ts'

const ROOM = 'Room 1'
const ROWS = ['A', 'B', 'C', 'D', 'E']
const SEATS_PER_ROW = 8

async function main() {
  await db
    .insert(users)
    .values([
      { email: 'alice@example.com', name: 'Alice' },
      { email: 'bob@example.com', name: 'Bob' },
    ])
    .onConflictDoNothing()

  const insertedFilms = await db
    .insert(films)
    .values([
      { title: 'The Grand Budapest Hotel' },
      { title: 'Spirited Away' },
      { title: 'Parasite' },
      { title: 'Dune: Part Two' },
      { title: 'Paddington in Peru' },
    ])
    .onConflictDoNothing()
    .returning()

  const allFilms = insertedFilms.length ? insertedFilms : await db.select().from(films)

  await db
    .insert(seats)
    .values(
      ROWS.flatMap((seatRow) =>
        Array.from({ length: SEATS_PER_ROW }, (_, i) => ({
          room: ROOM,
          seatRow,
          seatNumber: i + 1,
        })),
      ),
    )
    .onConflictDoNothing()

  await db
    .insert(showings)
    .values(
      allFilms.slice(0, 2).map((film, i) => ({
        filmId: film.id,
        room: ROOM,
        startsAt: new Date(Date.now() + (i + 1) * 3 * 60 * 60 * 1000),
      })),
    )

  console.log('seeded')
  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
