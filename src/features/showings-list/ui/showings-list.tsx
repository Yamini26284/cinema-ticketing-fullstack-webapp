import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Clapperboard, Loader2 } from 'lucide-react'

import { SHOWINGS_QUERY_KEY, fetchShowings } from '../api/showings'

export function ShowingsList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: SHOWINGS_QUERY_KEY,
    queryFn: fetchShowings,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-label-14 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading showings…
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-label-14 text-error">
        Failed to load showings: {error instanceof Error ? error.message : 'unknown'}
      </p>
    )
  }

  if (!data || data.length === 0) {
    return <p className="text-label-14 text-muted-foreground">No showings scheduled.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((showing) => (
        <li key={showing.id}>
          <Link
            to="/showings/$showingId"
            params={{ showingId: String(showing.id) }}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary-50 text-primary-700">
              <Clapperboard className="size-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-label-16 text-foreground">{showing.filmTitle}</span>
              <span className="text-label-13 text-muted-foreground">
                {showing.room} · {new Date(showing.startsAt).toLocaleString()}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
