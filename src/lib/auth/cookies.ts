import type { Cookie } from 'set-cookie-parser'

/*
 * ---------------------------------------------------------------------------
 * Cookie plumbing shared by `src/proxy.ts` and `src/lib/$fetch.ts`.
 *
 * Free of `next/headers` so the proxy can import it.
 * ---------------------------------------------------------------------------
 */

const ACCESS_TOKEN_COOKIE = 'accessToken'
const REFRESH_TOKEN_COOKIE = 'refreshToken'

/**
 * The only cookies exchanged with the backend. Everything else in the browser
 * jar (theme, analytics, other apps on the domain) stays out of API requests,
 * and the backend cannot plant arbitrary cookies on the app's origin.
 */
const AUTH_COOKIES: readonly string[] = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
]

const isAuthCookie = (name: string): boolean => AUTH_COOKIES.includes(name)

type TSameSite = 'lax' | 'strict' | 'none'

/**
 * Converts a parsed backend `Set-Cookie` into options for Next's cookie APIs
 * (`cookies().set`, `NextResponse.cookies.set`).
 *
 * `domain` is dropped: the cookie is re-issued by the Next.js origin, and a
 * backend domain (e.g. `api.example.com`) would make the browser reject it.
 * `sameSite` is lower-cased because `set-cookie-parser` preserves the
 * backend's casing (`Lax`) and Next's types only accept lower case.
 */
const toNextCookie = (cookie: Cookie) => {
  const { name, value, sameSite, ...rest } = cookie
  return {
    ...rest,
    domain: undefined,
    name,
    value,
    sameSite: sameSite?.toLowerCase() as TSameSite | undefined,
  }
}

/** Returns `original` (a `Cookie` header) with `updates` applied by name. */
const buildCookieHeader = (original: string, updates: Cookie[]): string => {
  const jar = new Map<string, string>()

  for (const pair of original.split(';')) {
    const index = pair.indexOf('=')
    if (index === -1) continue
    const name = pair.slice(0, index).trim()
    if (name) jar.set(name, pair.slice(index + 1).trim())
  }
  for (const { name, value } of updates) {
    jar.set(name, encodeURIComponent(value))
  }

  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
}

export {
  ACCESS_TOKEN_COOKIE,
  AUTH_COOKIES,
  buildCookieHeader,
  isAuthCookie,
  REFRESH_TOKEN_COOKIE,
  toNextCookie,
}
