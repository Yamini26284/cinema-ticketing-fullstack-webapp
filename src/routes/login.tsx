import { createFileRoute, redirect } from '@tanstack/react-router'

import { SESSION_QUERY_KEY, fetchMe } from '#/features/auth/api/auth'
import { LoginForm } from '#/features/auth/ui/login-form'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData({
      queryKey: SESSION_QUERY_KEY,
      queryFn: fetchMe,
    })
    if (user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoginForm />
    </div>
  )
}
