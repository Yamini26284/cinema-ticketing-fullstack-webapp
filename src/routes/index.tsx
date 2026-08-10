import { createFileRoute, redirect } from '@tanstack/react-router'

import { SESSION_QUERY_KEY, fetchMe } from '#/features/auth/api/auth'
import { FilmsList } from '#/features/films-list/ui/films-list'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData({
      queryKey: SESSION_QUERY_KEY,
      queryFn: fetchMe,
    })
    if (!user) throw redirect({ to: '/login' })
  },
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-heading-32 text-foreground">Now showing</h1>
      </header>
      <FilmsList />
    </div>
  )
}
