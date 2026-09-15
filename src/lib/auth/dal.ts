import 'server-only'

import { type TPermission } from '@/constant/permissions'
import { CACHE_TAGS } from '@/constant/tags'
import { $fetch } from '@/lib/$fetch'
import {
  assignableRoles,
  canActOnUser,
  canAll,
  type TActor,
} from '@/lib/auth/permissions'
import type { TUserRoleValue } from '@/lib/user-format'
import { isHttpError } from '@/lib/fetch'
import type { IUser, TUserResponse } from '@/types/user.types'
import { userIdSchema } from '@/validation/user.validation'
import { forbidden, notFound, redirect } from 'next/navigation'
import { cache } from 'react'

/*
 * ---------------------------------------------------------------------------
 * Data Access Layer — the authorization boundary.
 *
 * Next.js recommends centralising authorization here rather than in layouts
 * (which do not re-run on client-side navigation) or in the proxy (which is an
 * optimistic pre-filter, not a guarantee). Every guard in this file is meant to
 * be called from the page or Server Action that actually touches the data, so
 * that a new entry point cannot accidentally skip the check.
 *
 * The authoritative role comes from `/users/me` — not from decoding the access
 * token locally. That matters: `$fetch` owns the silent-refresh flow, so
 * reading the profile through it keeps working across a token rotation,
 * whereas a locally-verified JWT would hard-fail the moment the access token
 * aged out and would bounce the user to `/login` mid-navigation. Token
 * decoding is reserved for the proxy's optimistic check (`./token.ts`).
 *
 * React's `cache()` collapses all of this to one backend call per render pass,
 * however many guards run.
 * ---------------------------------------------------------------------------
 */

/**
 * `/users/:id` with the id validated and encoded. A malformed id is treated
 * as a user that does not exist.
 */
const userEndpoint = (id: string, suffix = ''): string => {
  if (!userIdSchema.safeParse(id).success) notFound()
  return `/users/${encodeURIComponent(id)}${suffix}`
}

/** Raw `/users/me` response. Callers usually want `getCurrentUser` instead. */
const fetchProfile = cache(async (): Promise<TUserResponse> => {
  const { data } = await $fetch.get<TUserResponse>('/users/me', {
    next: { tags: [CACHE_TAGS.PROFILE] },
  })
  return data
})

/**
 * Fetches a single user without a permission check.
 *
 * Module-private on purpose: `requireCanActOnUser` needs the target's role to
 * decide whether the actor may touch it, and routing that through the guarded
 * `getUserById` action would recurse straight back into this file. The public,
 * guarded read is `getUserById` in `src/app/actions/user.ts`.
 */
const fetchUserRecord = cache(async (id: string): Promise<IUser> => {
  const { data } = await $fetch.get<TUserResponse>(userEndpoint(id), {
    next: { tags: [CACHE_TAGS.USERS, CACHE_TAGS.USER(id)] },
  })
  return data.data
})

type TSessionRead =
  | { status: 'signed-in'; user: IUser }
  | { status: 'signed-out' }
  | { status: 'unavailable'; error: unknown }

/**
 * One profile read, classified. Only a 401/403 from the backend means
 * "signed out"; a timeout, outage, or 5xx is `unavailable` — the session may
 * be perfectly valid, we just can't confirm it right now.
 */
const readSession = cache(async (): Promise<TSessionRead> => {
  try {
    const response = await fetchProfile()
    return response.success && response.data
      ? { status: 'signed-in', user: response.data }
      : { status: 'signed-out' }
  } catch (error) {
    if (isHttpError(error) && (error.status === 401 || error.status === 403)) {
      return { status: 'signed-out' }
    }
    return { status: 'unavailable', error }
  }
})

/**
 * The signed-in user, or `null` when there is none *or it can't be confirmed*.
 *
 * Best effort, never throws — for display only (root layout, header), so an
 * API outage doesn't take down public pages. Guards use `verifySession()`.
 */
const getCurrentUser = cache(async (): Promise<IUser | null> => {
  const session = await readSession()
  return session.status === 'signed-in' ? session.user : null
})

/**
 * The signed-in user, redirecting to `/login` when there is none.
 *
 * An unavailable backend is rethrown for the nearest `error.tsx` instead of
 * redirecting: the proxy still sees a valid token and would send `/login`
 * straight back here, looping until the browser gives up.
 */
const verifySession = async (): Promise<IUser> => {
  const session = await readSession()
  if (session.status === 'unavailable') throw session.error
  if (session.status === 'signed-out') redirect('/login')
  return session.user
}

/**
 * Asserts the caller holds every listed permission.
 *
 * Renders the 403 interrupt (`src/app/forbidden.tsx`) on failure, so a page
 * and a Server Action deny access the same way and with the same status code.
 */
const requirePermission = async (
  ...permissions: TPermission[]
): Promise<IUser> => {
  const user = await verifySession()
  if (!canAll(user, permissions)) forbidden()
  return user
}

/**
 * Asserts the caller may exercise `permission` *against this specific user*.
 *
 * This is the guard against acting on a peer or a superior, and against
 * suspending or deleting oneself — the checks a bare role comparison misses.
 * Costs one extra backend read per targeted mutation; the target is cached per
 * render pass and tagged, and the backend remains the final authority.
 */
const requireCanActOnUser = async (
  targetId: string,
  permission: TPermission
): Promise<{ actor: IUser; target: IUser }> => {
  const actor = await requirePermission(permission)
  const target = await fetchUserRecord(targetId)
  if (!canActOnUser(actor, target, permission)) forbidden()
  return { actor, target }
}

/**
 * Asserts the caller may assign `role`.
 *
 * Separate from `requireCanActOnUser` because the constraint is on the *new*
 * value, not on the target: an ADMIN may edit a USER but must not be able to
 * promote them to ADMIN.
 */
const requireAssignableRole = (
  actor: TActor,
  role: TUserRoleValue,
  permission: TPermission
): void => {
  if (!assignableRoles(actor, permission).includes(role)) forbidden()
}

/** Non-throwing variant, for Server Components that render a fallback. */
const checkPermission = async (permission: TPermission): Promise<boolean> => {
  const user = await getCurrentUser()
  return canAll(user, [permission])
}

export {
  checkPermission,
  fetchProfile,
  getCurrentUser,
  requireAssignableRole,
  requireCanActOnUser,
  requirePermission,
  userEndpoint,
  verifySession,
}
