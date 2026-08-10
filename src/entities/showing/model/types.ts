import type { Film, Showing } from '#/db/schema'

export type ShowingListItem = Pick<Showing, 'id' | 'room' | 'startsAt'> & {
  filmId: Film['id']
  filmTitle: Film['title']
}
