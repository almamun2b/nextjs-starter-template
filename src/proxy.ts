import {
  DEFAULT_AUTHENTICATED_ROUTE,
  FORBIDDEN_ROUTE,
  isAuthRoute,
  REDIRECT_PARAM,
  resolveRoutePolicy,
} from '@/lib/auth/route-policy'
import { hasPermission } from '@/lib/auth/permissions'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  toNextCookie,
} from '@/lib/auth/cookies'
import { needsRefresh, refreshSession } from '@/lib/auth/refresh'
import { verifyAccessToken } from '@/lib/auth/token'
import { readUserRole } from '@/lib/user-format'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { Cookie } from 'set-cookie-parser'

/*
 * ---------------------------------------------------------------------------
 * Optimistic access gate.
 *
 * Runs on every request, so it stays cheap: it reads cookies and verifies a
 * JWT signature, and only talks to the backend to refresh an access token
 * that is missing, expired, or about to expire. Per the Next.js auth guide
 * this is a pre-filter, not the security boundary — the real check is
 * `requirePermission` in `src/lib/auth/dal.ts`, called by each page and each
 * Server Action. Server Functions POST to the route they live on, so a matcher
 * change could silently drop proxy coverage; the DAL guards are what make that
 * survivable.
 * ---------------------------------------------------------------------------
 */

const loginUrl = (request: NextRequest): URL => {
  const url = new URL('/login', request.url)
  // Preserve where they were heading so login can send them back.
  const { pathname, search } = request.nextUrl
  if (pathname !== '/') {
    url.searchParams.set(REDIRECT_PARAM, `${pathname}${search}`)
  }
  return url
}

/** Auth-cookie changes to mirror onto whichever response the proxy returns. */
interface IPendingCookies {
  set: Cookie[]
  clear: boolean
}

const withAuthCookies = (
  response: NextResponse,
  pending: IPendingCookies
): NextResponse => {
  for (const cookie of pending.set) {
    response.cookies.set(toNextCookie(cookie))
  }
  if (pending.clear) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE)
    response.cookies.delete(REFRESH_TOKEN_COOKIE)
  }
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  const pending: IPendingCookies = { set: [], clear: false }
  let refreshUnavailable = false

  let verification = verifyAccessToken(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  )

  // Refresh *here*, before rendering: Server Components cannot write cookies,
  // so a refresh that waits for `$fetch` to hit a 401 mid-render would never
  // reach the browser. The new cookies go on the forwarded request (so this
  // render's `cookies()` sees them) and on the response (so the browser does).
  if (refreshToken && needsRefresh(verification)) {
    const result = await refreshSession(refreshToken)

    if (result.status === 'ok') {
      for (const { name, value } of result.cookies) {
        request.cookies.set(name, value)
      }
      pending.set = result.cookies
      verification = verifyAccessToken(
        request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
      )
    } else if (result.status === 'rejected') {
      request.cookies.delete(ACCESS_TOKEN_COOKIE)
      request.cookies.delete(REFRESH_TOKEN_COOKIE)
      pending.clear = true
      verification = { status: 'invalid' }
    } else {
      // Backend unreachable — don't log the user out over a blip. Let the
      // request through unfiltered; the DAL still decides downstream.
      refreshUnavailable = true
    }
  }

  const claims = verification.status === 'valid' ? verification.claims : null
  const next = () =>
    withAuthCookies(
      NextResponse.next({ request: { headers: request.headers } }),
      pending
    )

  if (claims && isAuthRoute(pathname)) {
    return withAuthCookies(
      NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url)),
      pending
    )
  }

  const policy = resolveRoutePolicy(pathname)
  if (!policy) return next()

  if (!claims) {
    return refreshUnavailable
      ? next()
      : withAuthCookies(NextResponse.redirect(loginUrl(request)), pending)
  }

  const role = readUserRole(claims.role)
  if (!hasPermission(role, policy.permission)) {
    // Rewrite, not redirect: the URL stays put and `/403` renders the same
    // `forbidden()` interrupt (and 403 status) a page-level denial produces.
    return withAuthCookies(
      NextResponse.rewrite(new URL(FORBIDDEN_ROUTE, request.url), {
        request: { headers: request.headers },
      }),
      pending
    )
  }

  return next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
