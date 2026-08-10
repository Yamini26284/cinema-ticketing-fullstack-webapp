import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Film, LogOut } from 'lucide-react'

import {
  SESSION_QUERY_KEY,
  fetchMe,
  logout,
} from '#/features/auth/api/auth'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: user } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchMe,
  })

  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null)
      queryClient.clear()
      navigate({ to: '/login' })
    },
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary-600 text-white">
              <Film className="size-4" />
            </span>
            <span className="text-heading-14">Pensive Cinema</span>
          </Link>

          {user ? (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-label-13 text-muted-foreground">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-button-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
