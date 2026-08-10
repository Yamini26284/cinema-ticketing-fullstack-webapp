import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema.ts'

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres@localhost:5432/pensive'

export const sql = postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
})

export const db = drizzle(sql, { schema })
