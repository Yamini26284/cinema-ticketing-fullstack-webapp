import type { SessionUser } from '#/entities/user/model/types'

export const SESSION_QUERY_KEY = ['auth', 'me'] as const

export async function fetchMe(): Promise<SessionUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (!res.ok) throw new Error(`me failed: ${res.status}`)
  const body = (await res.json()) as { user: SessionUser | null }
  return body.user
}

export async function login(email: string): Promise<SessionUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `login failed: ${res.status}`)
  }
  const body = (await res.json()) as { user: SessionUser }
  return body.user
}

export async function logout(): Promise<void> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`logout failed: ${res.status}`)
}
