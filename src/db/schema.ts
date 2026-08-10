import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// Scaffolded so candidates don't burn time on auth or basic catalog plumbing.
// Extend freely — add showings, seats, holds, ratings, etc.

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const films = pgTable('films', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
})

export type User = typeof users.$inferSelect
export type Film = typeof films.$inferSelect
