import 'server-only'

import { API_BASE_URL } from '@/env'
import {
  buildCookieHeader,
  isAuthCookie,
  REFRESH_TOKEN_COOKIE,
  toNextCookie,
} from '@/lib/auth/cookies'
import { refreshSession } from '@/lib/auth/refresh'
import { cookies } from 'next/headers'
import { parseSetCookie, type Cookie } from 'set-cookie-parser'
import { createFetch, isHttpError } from './fetch'

/*
 * ---------------------------------------------------------------------------
 * The backend client. Every Server Component, Server Action, and DAL call goes
 * through this instance — never the unconfigured core in `./fetch`.
 *
 * - Talks to `${API_BASE_URL}` directly (server to server).
 * - Forwards only the auth cookies, and mirrors only auth `Set-Cookie`s back.
 * - Bounds every attempt with a timeout; retries idempotent reads once.
 * - On a 401 outside `/auth/*`, refreshes the session and retries once.
 * ---------------------------------------------------------------------------
 */

/** Per attempt. Keep it below the platform's function timeout. */
const REQUEST_TIMEOUT_MS = 10_000

const authPathPrefix = `${new URL(API_BASE_URL).pathname}/auth/`

/** Whether `url` is an `/auth/*` endpoint, where a 401 is a normal result. */
const isAuthEndpoint = (url: string): boolean =>
  new URL(url, API_BASE_URL).pathname.startsWith(authPathPrefix)

/**
 * Writes cookies to the browser. Throws inside a Server Component render
 * (cookies are read-only there); the proxy refreshes before render, so the
 * browser still gets fresh cookies on its next request.
 */
const trySetCookies = async (updates: Cookie[]): Promise<void> => {
  const cookieStore = await cookies()
  for (const cookie of updates) {
    try {
      const { name, value, ...options } = toNextCookie(cookie)
      cookieStore.set(name, value, options)
    } catch {
      return
    }
  }
}

const $fetch = createFetch({
  baseUrl: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  retry: 1,

  onRequest: async (req) => {
    const cookieHeader = (await cookies())
      .getAll()
      .filter(({ name }) => isAuthCookie(name))
      .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
      .join('; ')

    if (cookieHeader) {
      const headers = new Headers(req.init.headers)
      headers.set('Cookie', cookieHeader)
      req.init.headers = headers
    }

    return req
  },

  onResponse: async (res) => {
    const setCookies = parseSetCookie(res.headers.getSetCookie(), {
      decodeValues: true,
    }).filter(({ name }) => isAuthCookie(name))

    if (setCookies.length > 0) await trySetCookies(setCookies)
    return res
  },

  onError: async (error, context) => {
    // A 401 on `/auth/*` means bad credentials or a dead refresh token;
    // refreshing there would be wrong, and would recurse.
    if (!isHttpError(error) || error.status !== 401) throw error
    if (isAuthEndpoint(error.request.url)) throw error

    // Usually the proxy has already refreshed before this render/action ran;
    // this covers a token that expires in between, or a proxy refresh that
    // couldn't reach the backend. See the rotation note in `auth/refresh.ts`.
    const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value
    if (!refreshToken) throw error

    const result = await refreshSession(refreshToken)
    if (result.status !== 'ok') throw error

    await trySetCookies(result.cookies)

    const originalCookie =
      new Headers(context.request.init.headers).get('Cookie') ?? ''

    return context.retry({
      headers: { Cookie: buildCookieHeader(originalCookie, result.cookies) },
    })
  },
})

export { $fetch, isAuthEndpoint }
