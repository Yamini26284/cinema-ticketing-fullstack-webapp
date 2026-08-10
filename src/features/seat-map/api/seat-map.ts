import type { Hold, Seat } from '#/db/schema'

// Wire-format mirrors of the server types, with Date fields as ISO strings
// (Hono serializes Date -> string over JSON).
export type SeatMapItem = Pick<Seat, 'id' | 'seatRow' | 'seatNumber'> & {
  status: 'available' | 'held' | 'mine' | 'paid'
  holdId: Hold['id'] | null
  expiresAt: string | null
}

export type HoldRecord = Pick<Hold, 'id' | 'seatId' | 'status'> & {
  expiresAt: string | null
}

export function seatMapQueryKey(showingId: number) {
  return ['showings', showingId, 'seats'] as const
}

export async function fetchSeatMap(showingId: number): Promise<SeatMapItem[]> {
  const res = await fetch(`/api/showings/${showingId}/seats`, { credentials: 'include' })
  if (!res.ok) throw new Error(`seat map failed: ${res.status}`)
  const body = (await res.json()) as { seats: SeatMapItem[] }
  return body.seats
}

export type CreateHoldError =
  | { type: 'seat_taken'; seatIds: number[] }
  | { type: 'cap_exceeded'; requested: number; alreadyHeld: number }
  | { type: 'unknown'; status: number }

export async function createHold(showingId: number, seatIds: number[]): Promise<HoldRecord[]> {
  const res = await fetch('/api/holds', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ showingId, seatIds }),
  })
  const body = await res.json()
  if (!res.ok) {
    if (body.error === 'seat_taken') throw { type: 'seat_taken', seatIds: body.seatIds } satisfies CreateHoldError
    if (body.error === 'cap_exceeded')
      throw {
        type: 'cap_exceeded',
        requested: body.requested,
        alreadyHeld: body.alreadyHeld,
      } satisfies CreateHoldError
    throw { type: 'unknown', status: res.status } satisfies CreateHoldError
  }
  return body.holds
}

export type PayHoldsError = { type: 'not_owned' | 'expired' | 'already_paid' | 'not_found' | 'unknown'; holdIds?: number[] }

export async function payHolds(holdIds: number[]): Promise<HoldRecord[]> {
  const res = await fetch('/api/holds/pay', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holdIds }),
  })
  const body = await res.json()
  if (!res.ok) {
    throw { type: body.error ?? 'unknown', holdIds: body.holdIds } satisfies PayHoldsError
  }
  return body.holds
}
