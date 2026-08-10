import type { FilmListItem } from '#/entities/film/model/types'

export const FILMS_QUERY_KEY = ['films'] as const

export async function fetchFilms(): Promise<FilmListItem[]> {
  const res = await fetch('/api/films', { credentials: 'include' })
  if (!res.ok) throw new Error(`films failed: ${res.status}`)
  const body = (await res.json()) as { films: FilmListItem[] }
  return body.films
}
