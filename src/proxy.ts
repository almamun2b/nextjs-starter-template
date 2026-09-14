import {
  DEFAULT_AUTHENTICATED_ROUTE,
  FORBIDDEN_ROUTE,
  isAuthRoute,
  REDIRECT_PARAM,
  resolveRoutePolicy,
} from '@/lib/auth/route-policy'
import { hasPermission } from '@/lib/auth/permissions'
import { verifyAccessToken } from '@/lib/auth/token'
import { readUserRole } from '@/lib/user-format'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/*
 * ---------------------------------------------------------------------------
 * Optimistic access gate.
 *
 * Runs on every request, so it stays cheap: it reads cookies and verifies a
 * JWT signature, and never talks to the backend. Per the Next.js auth guide
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value

  const verification = verifyAccessToken(accessToken)

  // An expired access token next to a live refresh token is the ordinary
  // mid-session state — `$fetch` will rotate it on the next backend call. It
  // must read as signed in, or every token rotation would log the user out.
  const isRenewable = verification.status === 'expired' && !!refreshToken
  const isAuthenticated = verification.status === 'valid' || isRenewable

  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(
      new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url)
    )
  }

  const policy = resolveRoutePolicy(pathname)
  if (!policy) return NextResponse.next()

  if (!isAuthenticated) {
    return NextResponse.redirect(loginUrl(request))
  }

  // Role gating needs verified claims. While the token is merely stale we let
  // the request through unfiltered rather than authorizing on claims we have
  // not checked — the DAL still denies it downstream if the role is wrong.
  if (verification.status === 'valid') {
    const role = readUserRole(verification.claims.role)
    if (!hasPermission(role, policy.permission)) {
      // Rewrite, not redirect: the URL stays put and `/403` renders the same
      // `forbidden()` interrupt (and 403 status) a page-level denial produces.
      return NextResponse.rewrite(new URL(FORBIDDEN_ROUTE, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
