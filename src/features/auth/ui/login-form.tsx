import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

import { SESSION_QUERY_KEY, login } from '../api/auth'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (input: string) => login(input),
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user)
      navigate({ to: '/' })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!email.trim()) return
        mutation.mutate(email)
      }}
      className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-6 card-shadow"
    >
      <h1 className="text-heading-20 text-center text-foreground">Sign in</h1>

      <label className="flex flex-col gap-1.5">
        <span className="text-label-13 text-muted-foreground">Email</span>
        <input
          type="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alice@example.com"
          className="rounded-md border border-input bg-background px-3 py-2 text-label-14 text-foreground outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        />
      </label>

      {mutation.isError ? (
        <p className="text-label-13 text-error">
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'Sign-in failed'}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={mutation.isPending || !email.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-button-default text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in…
          </>
        ) : (
          'Continue'
        )}
      </button>
    </form>
  )
}
