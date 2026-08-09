import { cookies } from 'next/headers'
import { parseSetCookie } from 'set-cookie-parser'

/**
 * Shared helpers for the HttpOnly access/refresh-token flow.
 *
 * Context rules this module exists for:
 * - `cookies().set()` only works inside a Server Action / Route Handler. It
 *   throws `ReadonlyRequestCookiesError` during a Server Component render
 *   (e.g. when a `'use server'` action is invoked directly from a page).
 * - Every cookie write here is therefore best-effort: it returns `false`
 *   when the current context is read-only instead of crashing the request.
 */

type SameSite = 'lax' | 'strict' | 'none' | undefined

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
const REFRESH_ENDPOINT = '/auth/refresh-token'

export type RefreshResult = {
  ok: boolean
  status: number
  /** Whether the new cookies were actually written (false in read-only contexts). */
  applied: boolean
}

/**
 * Calls the backend refresh endpoint with the given cookie header, using a
 * raw native fetch so we never recurse through `$fetch`'s own `onError`.
 */
export const callRefreshEndpoint = (cookieString: string): Promise<Response> =>
  fetch(`${API_BASE_URL}${REFRESH_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieString ? { Cookie: cookieString } : {}),
    },
    cache: 'no-store',
  })

/**
 * Applies backend `Set-Cookie` headers onto the current Next.js cookie store.
 * Returns `false` in read-only contexts (Server Component render) instead of
 * throwing — the caller decides what to do when the cookies couldn't persist.
 */
export const applySetCookies = async (
  setCookieHeaders: string[]
): Promise<boolean> => {
  if (setCookieHeaders.length === 0) return true

  try {
    const store = await cookies()

    for (const cookie of parseSetCookie(setCookieHeaders, {
      decodeValues: true,
    })) {
      const { name, value, ...rest } = cookie
      store.set(name, value, {
        ...rest,
        sameSite: rest.sameSite as SameSite,
      })
    }

    return true
  } catch {
    return false
  }
}

// Deduplicates concurrent refresh calls. Keyed by the current cookie string so
// different requests (different users) never share a refresh result.
let refreshPromise: Promise<RefreshResult> | null = null
let refreshKey: string | null = null

// Per-request mutability cache (each request gets its own cookie store
// instance, so the WeakMap never leaks across requests).
const writableCache = new WeakMap<object, boolean>()

/**
 * Detects whether the current context can write cookies (Server Action /
 * Route Handler) or is read-only (Server Component render). The probe cookie
 * is set then immediately deleted, so it only ever emits a harmless
 * `Max-Age=0` header in writable contexts.
 */
export const isCookieWritable = async (): Promise<boolean> => {
  const store = await cookies()

  const cached = writableCache.get(store)
  if (cached !== undefined) return cached

  let writable = true
  try {
    store.set('__auth_probe__', '1', { maxAge: 1 })
    store.delete('__auth_probe__')
  } catch {
    writable = false
  }

  writableCache.set(store, writable)
  return writable
}

const doRefresh = async (): Promise<RefreshResult> => {
  try {
    const store = await cookies()
    const refreshToken = store.get('refreshToken')?.value

    // Backend contract: `/auth/refresh-token` reads the refresh token from
    // the `refreshToken` cookie, so only that cookie is forwarded.
    if (!refreshToken) {
      return { ok: false, status: 0, applied: false }
    }

    const response = await callRefreshEndpoint(`refreshToken=${refreshToken}`)
    const setCookies = response.headers.getSetCookie?.() ?? []
    const applied = await applySetCookies(setCookies)

    return { ok: response.ok, status: response.status, applied }
  } catch {
    return { ok: false, status: 0, applied: false }
  }
}

/**
 * Refreshes the access/refresh token pair using the `refreshToken` cookie.
 * Safe to call from any server context. In a read-only context (Server
 * Component render) the refresh API call is skipped entirely — calling it
 * would rotate the server-side tokens without being able to persist the new
 * cookies, effectively logging the user out.
 */
export const refreshTokens = async (): Promise<RefreshResult> => {
  if (!(await isCookieWritable())) {
    return { ok: false, status: 0, applied: false }
  }

  // Deduplicate concurrent refreshes, keyed by the refresh token so
  // different users never share a refresh result.
  const store = await cookies()
  const key = store.get('refreshToken')?.value ?? ''

  if (!refreshPromise || refreshKey !== key) {
    refreshKey = key
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
      refreshKey = null
    })
  }

  return refreshPromise
}

/**
 * Parses a `Cookie` request header into a name → value map.
 */
export const parseCookieHeader = (
  cookieString: string
): Record<string, string> => {
  const result: Record<string, string> = {}

  for (const part of cookieString.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue

    const name = part.slice(0, eq).trim()
    const value = part.slice(eq + 1).trim()

    if (name) result[name] = value
  }

  return result
}
