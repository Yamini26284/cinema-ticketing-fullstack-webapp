import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { createHold, fetchSeatMap, payHolds, seatMapQueryKey } from '../api/seat-map'
import type { CreateHoldError, HoldRecord, PayHoldsError } from '../api/seat-map'

const MAX_TICKETS_PER_SHOWING = 7
const POLL_INTERVAL_MS = 4000

export function SeatMap({ showingId }: { showingId: number }) {
  const queryClient = useQueryClient()
  const queryKey = seatMapQueryKey(showingId)

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchSeatMap(showingId),
    refetchInterval: POLL_INTERVAL_MS,
  })

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [myHolds, setMyHolds] = useState<HoldRecord[]>([])
  const [banner, setBanner] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const holdMutation = useMutation({
    mutationFn: (seatIds: number[]) => createHold(showingId, seatIds),
    onSuccess: (holds) => {
      setMyHolds(holds)
      setSelected(new Set())
      setBanner(null)
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: CreateHoldError) => {
      if (err.type === 'seat_taken') {
        setBanner('One or more selected seats were just taken — please reselect.')
        setSelected((prev) => {
          const next = new Set(prev)
          err.seatIds.forEach((id) => next.delete(id))
          return next
        })
      } else if (err.type === 'cap_exceeded') {
        setBanner(`You can hold at most ${MAX_TICKETS_PER_SHOWING} seats for this showing (you already have ${err.alreadyHeld}).`)
      } else {
        setBanner('Something went wrong holding those seats. Try again.')
      }
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const payMutation = useMutation({
    mutationFn: (holdIds: number[]) => payHolds(holdIds),
    onSuccess: () => {
      setConfirmed(true)
      setMyHolds([])
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: PayHoldsError) => {
      if (err.type === 'expired') setBanner('Your hold expired before payment completed. Please select seats again.')
      else if (err.type === 'already_paid') setBanner('These seats are already paid for.')
      else setBanner('Payment failed. Please try again.')
      setMyHolds([])
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const earliestExpiry = myHolds.length
    ? Math.min(...myHolds.map((h) => (h.expiresAt ? new Date(h.expiresAt).getTime() : Infinity)))
    : null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!earliestExpiry) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [earliestExpiry])

  useEffect(() => {
    if (earliestExpiry && now >= earliestExpiry && myHolds.length > 0) {
      setBanner('Your hold expired. Please select seats again.')
      setMyHolds([])
      queryClient.invalidateQueries({ queryKey })
    }
  }, [now, earliestExpiry, myHolds.length, queryClient, queryKey])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-label-14 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading seat map…
      </div>
    )
  }

  if (isError || !data) {
    return <p className="text-label-14 text-error">Failed to load seat map.</p>
  }

  if (confirmed) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-heading-20 text-foreground">You're all set!</p>
        <p className="mt-1 text-label-14 text-muted-foreground">Your tickets are confirmed. Enjoy the show.</p>
      </div>
    )
  }

  const rows = Array.from(new Set(data.map((s) => s.seatRow))).sort()
  const secondsLeft = earliestExpiry ? Math.max(0, Math.ceil((earliestExpiry - now) / 1000)) : null

  function toggleSeat(seat: SeatMapItemLike) {
    if (seat.status !== 'available' || myHolds.length > 0) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(seat.id)) next.delete(seat.id)
      else next.add(seat.id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {banner ? (
        <div className="rounded-md border border-warning bg-warning/10 px-4 py-2 text-label-14 text-foreground">
          {banner}
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-2">
        <div className="mb-2 w-full max-w-md rounded-md bg-muted py-1 text-center text-label-12 text-muted-foreground">
          screen
        </div>
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="w-4 text-label-12 text-muted-foreground">{row}</span>
            {data
              .filter((s) => s.seatRow === row)
              .sort((a, b) => a.seatNumber - b.seatNumber)
              .map((seat) => (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  isSelected={selected.has(seat.id)}
                  isMyPendingHold={myHolds.some((h) => h.seatId === seat.id)}
                  onClick={() => toggleSeat(seat)}
                />
              ))}
          </div>
        ))}
      </div>

      {myHolds.length > 0 ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <div>
            <p className="text-label-14 text-foreground">
              {myHolds.length} seat{myHolds.length > 1 ? 's' : ''} held
            </p>
            <p className="text-label-13 text-muted-foreground">
              Complete payment within {secondsLeft ?? 0}s or the hold releases.
            </p>
          </div>
          <button
            type="button"
            onClick={() => payMutation.mutate(myHolds.map((h) => h.id))}
            disabled={payMutation.isPending || secondsLeft === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-button-sm text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {payMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Pay now
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-label-14 text-muted-foreground">
            {selected.size} seat{selected.size === 1 ? '' : 's'} selected
            {selected.size > MAX_TICKETS_PER_SHOWING ? ` (max ${MAX_TICKETS_PER_SHOWING} per showing)` : ''}
          </p>
          <button
            type="button"
            onClick={() => holdMutation.mutate(Array.from(selected))}
            disabled={selected.size === 0 || selected.size > MAX_TICKETS_PER_SHOWING || holdMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-button-sm text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {holdMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Hold seats
          </button>
        </div>
      )}
    </div>
  )
}

type SeatMapItemLike = { id: number; status: string }

function SeatButton({
  seat,
  isSelected,
  isMyPendingHold,
  onClick,
}: {
  seat: { id: number; seatRow: string; seatNumber: number; status: string }
  isSelected: boolean
  isMyPendingHold: boolean
  onClick: () => void
}) {
  const disabled = seat.status === 'held' || seat.status === 'paid' || (seat.status === 'mine' && !isMyPendingHold)

  let classes = 'flex size-7 items-center justify-center rounded-md text-label-11 transition-colors'
  if (seat.status === 'paid') classes += ' bg-muted text-muted-foreground cursor-not-allowed'
  else if (seat.status === 'held') classes += ' bg-error/15 text-error cursor-not-allowed'
  else if (isMyPendingHold || isSelected) classes += ' bg-primary-600 text-white'
  else classes += ' bg-card border border-border text-foreground hover:bg-accent cursor-pointer'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={`${seat.seatRow}${seat.seatNumber} — ${seat.status}`}
      className={classes}
    >
      {seat.seatNumber}
    </button>
  )
}
