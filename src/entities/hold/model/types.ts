import type { Hold, Seat } from '#/db/schema'

export const HOLD_TTL_MS = 5 * 60 * 1000
export const MAX_TICKETS_PER_SHOWING = 7

export type SeatStatus = 'available' | 'held' | 'mine' | 'paid'

export type SeatMapItem = Pick<Seat, 'id' | 'seatRow' | 'seatNumber'> & {
  status: SeatStatus
  holdId: Hold['id'] | null
  expiresAt: Hold['expiresAt'] | null
}

export class SeatTakenError extends Error {
  constructor(public seatIds: number[]) {
    super('one or more seats are no longer available')
  }
}

export class CapExceededError extends Error {
  constructor(
    public requested: number,
    public alreadyHeld: number,
  ) {
    super(`purchase cap exceeded: ${alreadyHeld} held + ${requested} requested > ${MAX_TICKETS_PER_SHOWING}`)
  }
}

export class HoldInvalidError extends Error {
  constructor(
    public holdIds: number[],
    public reason: 'not_found' | 'not_owned' | 'expired' | 'already_paid',
  ) {
    super(`hold(s) ${holdIds.join(',')} invalid: ${reason}`)
  }
}
