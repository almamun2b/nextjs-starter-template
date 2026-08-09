import { cookies } from 'next/headers'
import { applySetCookies, refreshTokens } from '@/lib/auth-refresh'
import { createFetch } from './fetch'
import { FetchError } from './fetch/fetch-error'

const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`

/**
 * Endpoints that should never trigger auto-refresh — a 401 there means
 * bad credentials / an expired reset link, not an expired access token.
 */
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/refresh-token',
]

const $fetch = createFetch({
  baseUrl,
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',

  onRequest: async (req) => {
    // Forward the client's HttpOnly cookies to the downstream backend.
    const cookieStore = await cookies()
    const cookieString = cookieStore.toString()

    if (cookieString) {
      const headers = new Headers(req.init.headers)
      headers.set('Cookie', cookieString)
      req.init.headers = headers
    }

    return req
  },

  onResponse: async (res) => {
    // Forward backend Set-Cookie (e.g. refreshed tokens) back to the browser.
    // Best-effort: silently skipped when the current context is read-only
    // (Server Component render) instead of throwing.
    await applySetCookies(res.headers.getSetCookie?.() ?? [])
    return res
  },

  onError: async (error, retry) => {
    if (error instanceof FetchError && error.status === 401) {
      const isAuthEndpoint = NO_REFRESH_PATHS.some((path) =>
        error.url.includes(path)
      )

      if (!isAuthEndpoint) {
        const { ok, applied } = await refreshTokens()

        // Only retry when the new cookies actually landed in the store —
        // in a read-only context a retry would just 401 again.
        if (ok && applied) {
          const result = await retry()
          if (result) return result
        }
      }
    }

    throw error
  },
})

export { $fetch }
