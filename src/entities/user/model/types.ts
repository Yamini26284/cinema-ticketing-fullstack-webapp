import type { User } from '#/db/schema'

// Shape sent to the client. Add fields here as the user model grows;
// don't leak `created_at` etc. unless a screen needs it.
export type SessionUser = Pick<User, 'id' | 'email' | 'name'>

export function toSessionUser(user: User): SessionUser {
  return { id: user.id, email: user.email, name: user.name }
}
