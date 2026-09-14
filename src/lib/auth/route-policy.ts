import { PERMISSIONS, type TPermission } from '@/constant/permissions'

/*
 * ---------------------------------------------------------------------------
 * Route → permission map.
 *
 * Imported by both `src/proxy.ts` (the optimistic gate) and the sidebar (nav
 * visibility), so a route that becomes admin-only can never keep showing up in
 * someone's navigation. Pages still guard themselves through the DAL — this
 * table decides *which* permission a route needs, not whether the check is
 * trustworthy.
 * ---------------------------------------------------------------------------
 */

interface IRoutePolicy {
  /** Matches the pathname itself and anything nested beneath it. */
  prefix: string
  permission: TPermission
}

/**
 * Order does not matter — `resolveRoutePolicy` picks the longest match, so a
 * nested rule always wins over its parent.
 */
const ROUTE_POLICIES: readonly IRoutePolicy[] = [
  { prefix: '/dashboard', permission: PERMISSIONS.DASHBOARD_READ },
  { prefix: '/users', permission: PERMISSIONS.USERS_READ },
  { prefix: '/settings', permission: PERMISSIONS.SETTINGS_READ },
  { prefix: '/profile', permission: PERMISSIONS.PROFILE_READ },
  { prefix: '/change-password', permission: PERMISSIONS.PROFILE_PASSWORD },
]

/** Routes only a signed-out visitor should see. */
const AUTH_ROUTES: readonly string[] = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

/** Where the proxy sends a signed-in user who lands on an `(auth)` route. */
const DEFAULT_AUTHENTICATED_ROUTE = '/dashboard'

/** Rendered by `src/app/403/page.tsx`; the proxy rewrites here on a denial. */
const FORBIDDEN_ROUTE = '/403'

const matchesPrefix = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

/** The most specific policy covering `pathname`, or `null` if it is public. */
const resolveRoutePolicy = (pathname: string): IRoutePolicy | null =>
  ROUTE_POLICIES.filter((policy) =>
    matchesPrefix(pathname, policy.prefix)
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0] ?? null

/** Does reaching this route require being signed in at all? */
const isProtectedRoute = (pathname: string): boolean =>
  resolveRoutePolicy(pathname) !== null

const isAuthRoute = (pathname: string): boolean =>
  AUTH_ROUTES.includes(pathname)

/** The query key the proxy uses to stash a blocked destination. */
const REDIRECT_PARAM = 'next'

/**
 * Normalizes a `?next=` value into somewhere safe to send the user.
 *
 * Only same-origin absolute paths survive, so a crafted
 * `?next=https://evil.test` (or the protocol-relative `//evil.test`) cannot
 * turn the login page into an open redirect.
 */
const safeRedirectTarget = (
  next: string | string[] | null | undefined,
  fallback: string = DEFAULT_AUTHENTICATED_ROUTE
): string => {
  const value = Array.isArray(next) ? next[0] : next
  if (!value || !value.startsWith('/') || value.startsWith('//'))
    return fallback
  return value
}

export {
  AUTH_ROUTES,
  DEFAULT_AUTHENTICATED_ROUTE,
  FORBIDDEN_ROUTE,
  isAuthRoute,
  isProtectedRoute,
  REDIRECT_PARAM,
  ROUTE_POLICIES,
  resolveRoutePolicy,
  safeRedirectTarget,
  type IRoutePolicy,
}
