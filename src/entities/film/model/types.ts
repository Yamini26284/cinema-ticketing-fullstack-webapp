import type { Film } from '#/db/schema'

// Catalog row shown to customers. Extend (rating, runtime, etc.) as needed.
export type FilmListItem = Pick<Film, 'id' | 'title'>
