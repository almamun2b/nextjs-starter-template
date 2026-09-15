import { API_BASE_URL } from '@/env'
import {
  ACCESS_TOKEN_COOKIE,
  isAuthCookie,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth/cookies'
import type { TVerifyResult } from '@/lib/auth/token'
import { parseSetCookie, type Cookie } from 'set-cookie-parser'

/*
 * ---------------------------------------------------------------------------
 * Session refresh.
 *
 * Like `./token.ts`, deliberately free of `next/headers` and `$fetch` so both
 * `src/proxy.ts` and `src/lib/$fetch.ts` can use it.
 *
 * The proxy is the primary caller: it is the only place that runs before a
 * Server Component render *and* can write cookies, so it refreshes an expired
 * (or already-deleted) access token before the page ever calls the backend.
 * `$fetch` falls back to it on a 401 that slips past the proxy.
 *
 * Refresh-token rotation: the backend currently re-issues but does not revoke
 * the old refresh token (the blacklist call in its `auth.service.ts` is
 * commented out). That is what makes the `$fetch` fallback safe during a
 * Server Component render, where the new cookies cannot reach the browser.
 * Before turning rotation on, give the backend a short reuse grace window for
 * the previous token — otherwise that fallback, or two app instances
 * refreshing concurrently (`inflight` below is per process), log users out.
 * ---------------------------------------------------------------------------
 */

const REFRESH_URL = `${API_BASE_URL}/auth/refresh-token`

/** The proxy awaits this on every navigation that needs a refresh. */
const REFRESH_TIMEOUT_MS = 5_000

/** Refresh this long before `exp` so a token can't expire mid-request. */
const EXPIRY_SKEW_SECONDS = 30

/** How long a settled refresh stays shared, covering parallel RSC requests. */
const DEDUP_GRACE_MS = 5_000

type TRefreshResult =
  | { status: 'ok'; cookies: Cookie[] }
  /** The backend refused the refresh token — the session is over. */
  | { status: 'rejected' }
  /** Network error, timeout, or 5xx — the session may still be fine. */
  | { status: 'unavailable' }

/**
 * Keyed by refresh-token value, so concurrent requests from the *same*
 * session share one backend call while different users never share results.
 */
const inflight = new Map<string, Promise<TRefreshResult>>()

const requestRefresh = async (
  refreshToken: string
): Promise<TRefreshResult> => {
  try {
    const response = await fetch(REFRESH_URL, {
      method: 'POST',
      headers: {
        Cookie: `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    })

    if (response.status >= 500) return { status: 'unavailable' }
    if (!response.ok) return { status: 'rejected' }

    const cookies = parseSetCookie(response.headers.getSetCookie(), {
      decodeValues: true,
    }).filter((cookie) => isAuthCookie(cookie.name))
    const hasAccessToken = cookies.some(
      (cookie) => cookie.name === ACCESS_TOKEN_COOKIE && cookie.value
    )

    return hasAccessToken ? { status: 'ok', cookies } : { status: 'rejected' }
  } catch {
    return { status: 'unavailable' }
  }
}

/** Exchanges a refresh token for new auth cookies, deduplicated per token. */
const refreshSession = (refreshToken: string): Promise<TRefreshResult> => {
  const pending = inflight.get(refreshToken)
  if (pending) return pending

  const promise = requestRefresh(refreshToken).finally(() => {
    setTimeout(() => inflight.delete(refreshToken), DEDUP_GRACE_MS)
  })
  inflight.set(refreshToken, promise)
  return promise
}

/**
 * Whether the access token should be refreshed before use: missing, invalid,
 * expired, or about to expire. The backend gives the `accessToken` cookie the
 * same lifetime as the JWT, so an expired token usually arrives as *no* token.
 */
const needsRefresh = (verification: TVerifyResult): boolean => {
  if (verification.status !== 'valid') return true
  const { exp } = verification.claims
  if (!exp) return false
  return exp - EXPIRY_SKEW_SECONDS <= Math.floor(Date.now() / 1000)
}

export { needsRefresh, refreshSession, type TRefreshResult }
