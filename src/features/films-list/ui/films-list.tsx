import { useQuery } from '@tanstack/react-query'
import { Film, Loader2 } from 'lucide-react'

import { FILMS_QUERY_KEY, fetchFilms } from '../api/films'

export function FilmsList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: FILMS_QUERY_KEY,
    queryFn: fetchFilms,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-label-14 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading films…
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-label-14 text-error">
        Failed to load films: {error instanceof Error ? error.message : 'unknown'}
      </p>
    )
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-label-14 text-muted-foreground">No films yet.</p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((film) => (
        <li
          key={film.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-primary-50 text-primary-700">
            <Film className="size-4" />
          </span>
          <span className="text-label-16 text-foreground">{film.title}</span>
        </li>
      ))}
    </ul>
  )
}
