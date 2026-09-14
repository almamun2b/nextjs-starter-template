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
import type { IUser, TUserResponse } from '@/types/user.types'
import { forbidden, redirect } from 'next/navigation'
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
  const { data } = await $fetch.get<TUserResponse>(`/users/${id}`, {
    next: { tags: [CACHE_TAGS.USERS, CACHE_TAGS.USER(id)] },
  })
  return data.data
})

/**
 * The signed-in user, or `null` when there is no usable session.
 *
 * Never throws — a failed profile read is treated as "signed out" so callers
 * can branch on it. Use `verifySession()` when absence should redirect.
 */
const getCurrentUser = cache(async (): Promise<IUser | null> => {
  try {
    const response = await fetchProfile()
    return response.success && response.data ? response.data : null
  } catch {
    return null
  }
})

/** The signed-in user, redirecting to `/login` when there is none. */
const verifySession = async (): Promise<IUser> => {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
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
  verifySession,
}
