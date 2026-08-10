import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

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

export const showings = pgTable('showings', {
  id: serial('id').primaryKey(),
  filmId: integer('film_id')
    .notNull()
    .references(() => films.id),
  room: text('room').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
})

// Seats belong to a room and are shared across every showing in that room.
export const seats = pgTable(
  'seats',
  {
    id: serial('id').primaryKey(),
    room: text('room').notNull(),
    seatRow: text('seat_row').notNull(),
    seatNumber: integer('seat_number').notNull(),
  },
  (t) => [unique().on(t.room, t.seatRow, t.seatNumber)],
)

// A paid hold *is* the ticket — no separate tickets table.
// status: 'active' (pending payment) | 'paid' | 'expired' | 'cancelled'
export const holds = pgTable(
  'holds',
  {
    id: serial('id').primaryKey(),
    showingId: integer('showing_id')
      .notNull()
      .references(() => showings.id),
    seatId: integer('seat_id')
      .notNull()
      .references(() => seats.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    status: text('status').notNull().default('active'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // The no-double-sell guarantee: only one live (active or paid) hold
    // can exist per seat per showing. Enforced by Postgres, not app code.
    uniqueIndex('holds_live_seat_unique')
      .on(t.showingId, t.seatId)
      .where(sql`${t.status} in ('active', 'paid')`),
  ],
)

export type User = typeof users.$inferSelect
export type Film = typeof films.$inferSelect
export type Showing = typeof showings.$inferSelect
export type Seat = typeof seats.$inferSelect
export type Hold = typeof holds.$inferSelect
