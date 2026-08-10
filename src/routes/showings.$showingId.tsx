import { createFileRoute, redirect } from '@tanstack/react-router'

import { SESSION_QUERY_KEY, fetchMe } from '#/features/auth/api/auth'
import { SeatMap } from '#/features/seat-map/ui/seat-map'

export const Route = createFileRoute('/showings/$showingId')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData({
      queryKey: SESSION_QUERY_KEY,
      queryFn: fetchMe,
    })
    if (!user) throw redirect({ to: '/login' })
  },
  component: ShowingPage,
})

function ShowingPage() {
  const { showingId } = Route.useParams()
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-heading-32 text-foreground">Select your seats</h1>
      </header>
      <SeatMap showingId={Number(showingId)} />
    </div>
  )
}
