import type { ShowingListItem } from '#/entities/showing/model/types'

export const SHOWINGS_QUERY_KEY = ['showings'] as const

export async function fetchShowings(): Promise<ShowingListItem[]> {
  const res = await fetch('/api/showings', { credentials: 'include' })
  if (!res.ok) throw new Error(`showings failed: ${res.status}`)
  const body = (await res.json()) as { showings: ShowingListItem[] }
  return body.showings
}
