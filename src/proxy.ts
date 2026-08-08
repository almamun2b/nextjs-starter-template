import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/users',
  '/change-password',
]

const REFRESH_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token`

/**
 * Decodes the `exp` claim of a JWT without verifying its signature. Returns
 * `null` when the token is malformed or carries no expiry — callers treat
 * `null` as "expired / needs refresh".
 */
const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    )
    return typeof decoded.exp === 'number' ? decoded.exp : null
  } catch {
    return null
  }
}

const isAccessTokenExpired = (token?: string): boolean => {
  if (!token) return true
  const exp = getTokenExpiry(token)
  if (exp === null) return true
  return exp * 1000 <= Date.now()
}

/**
 * Calls the backend `/auth/refresh-token` endpoint with the `refreshToken`
 * cookie and returns the raw `Set-Cookie` headers it emits (new access +
 * refresh token pair). Returns `[]` when the refresh fails or the backend
 * sends no cookies, so callers can fall back to redirecting to /login.
 */
const tryRefreshTokens = async (refreshToken: string): Promise<string[]> => {
  try {
    const response = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) return []
    return response.headers.getSetCookie?.() ?? []
  } catch {
    return []
  }
}

/**
 * Proxy (middleware) auth guard + silent token refresh.
 *
 * Why refresh here instead of in `$fetch.onError`:
 * - Page loads render Server Components in a *read-only* cookie context, so
 *   `cookies().set()` throws there and a refresh cannot persist its new
 *   tokens. Proxy runs *before* rendering, and cookies set on its response
 *   are written to the browser — the only reliable place to refresh on
 *   navigation.
 * - Server Actions / Route Handlers are *writable*, so they keep their own
 *   refresh path (`$fetch.onError` → `refreshTokens()`); this Proxy leaves
 *   non-GET requests alone so it never hijacks an in-flight action.
 *
 * Refresh flow: on any GET with an expired/missing access token but a
 * present refresh token, call the backend, attach the new Set-Cookie headers
 * to a redirect tagged `?tokenRefreshed=true`, then strip the tag on the
 * follow-up request so the page renders with the fresh cookies. This runs
 * for *every* route (not just protected ones) because the root layout
 * fetches the current user on all pages — a stale access token there would
 * otherwise surface as a 401 with no way to refresh in the read-only render.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // After a successful refresh the request returns tagged with
  // `tokenRefreshed` — strip the tag and re-issue so the page renders with
  // the freshly stored cookies.
  if (searchParams.has('tokenRefreshed')) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('tokenRefreshed')
    return NextResponse.redirect(cleanUrl)
  }

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isPublic = publicRoutes.includes(pathname)

  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value
  const hasValidAccess = !!accessToken && !isAccessTokenExpired(accessToken)

  // Silent refresh on every GET route: if the access token is expired or
  // missing but a refresh token exists, rotate the pair before the page
  // renders. Only GET navigations refresh here — Server Actions / Route
  // Handlers handle refresh themselves in their writable cookie context.
  if (!hasValidAccess && request.method === 'GET' && refreshToken) {
    const setCookies = await tryRefreshTokens(refreshToken)

    if (setCookies.length > 0) {
      const refreshUrl = request.nextUrl.clone()
      refreshUrl.searchParams.set('tokenRefreshed', 'true')

      const response = NextResponse.redirect(refreshUrl)
      for (const setCookie of setCookies) {
        response.headers.append('Set-Cookie', setCookie)
      }
      return response
    }
  }

  // No valid access token left on a protected route — the user is
  // effectively logged out (either no refresh token, or the refresh failed).
  if (isProtected && !hasValidAccess) {
    if (!refreshToken || request.method === 'GET') {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Logged-in users skip auth pages.
  if (isPublic && hasValidAccess) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher:
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
}
