import { db, sql } from './index.ts'
import { films, users } from './schema.ts'

async function main() {
  await db
    .insert(users)
    .values([
      { email: 'alice@example.com', name: 'Alice' },
      { email: 'bob@example.com', name: 'Bob' },
    ])
    .onConflictDoNothing()

  await db
    .insert(films)
    .values([
      { title: 'The Grand Budapest Hotel' },
      { title: 'Spirited Away' },
      { title: 'Parasite' },
      { title: 'Dune: Part Two' },
      { title: 'Paddington in Peru' },
    ])
    .onConflictDoNothing()

  console.log('seeded')
  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
