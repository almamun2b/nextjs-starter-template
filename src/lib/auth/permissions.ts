import {
  PERMISSIONS,
  READ_ONLY_PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_RANK,
  SELF_PROTECTED_PERMISSIONS,
  type TPermission,
} from '@/constant/permissions'
import { readUserRole, type TUserRoleValue } from '@/lib/user-format'
import type { IUser } from '@/types/user.types'

/*
 * ---------------------------------------------------------------------------
 * Pure ability checks — isomorphic on purpose.
 *
 * Nothing here touches cookies, `next/headers`, or the network, so the same
 * functions back the server-side guards in `./dal.ts`, the optimistic route
 * gate in `src/proxy.ts`, and the client-side `<Can>` component. One rule,
 * one implementation, no drift between what the UI offers and what the server
 * allows.
 *
 * These are *not* the security boundary. `dal.ts` is, and the backend is the
 * final authority; this module just makes both agree.
 * ---------------------------------------------------------------------------
 */

/** The minimum an actor has to be for any check here. */
type TActor = Pick<IUser, 'id' | 'role'>

/** The minimum a mutation target has to be for a resource-level check. */
type TTarget = Pick<IUser, 'id' | 'role'>

const permissionsForRole = (role: TUserRoleValue): readonly TPermission[] =>
  ROLE_PERMISSIONS[role] ?? []

const hasPermission = (
  role: TUserRoleValue,
  permission: TPermission
): boolean => permissionsForRole(role).includes(permission)

const hasAnyPermission = (
  role: TUserRoleValue,
  permissions: readonly TPermission[]
): boolean => permissions.some((permission) => hasPermission(role, permission))

const hasAllPermissions = (
  role: TUserRoleValue,
  permissions: readonly TPermission[]
): boolean => permissions.every((permission) => hasPermission(role, permission))

/**
 * `UserRole` is declared as a numeric TS enum while the API sends its string
 * keys, so every read goes through `readUserRole` rather than comparing
 * against `UserRole.ADMIN`. See the note in `@/lib/user-format`.
 */
const roleOf = (actor: TActor | null | undefined): TUserRoleValue | null =>
  actor ? readUserRole(actor.role) : null

/** Does this actor hold the permission at all? Signed-out actors hold none. */
const can = (
  actor: TActor | null | undefined,
  permission: TPermission
): boolean => {
  const role = roleOf(actor)
  return role !== null && hasPermission(role, permission)
}

const canAny = (
  actor: TActor | null | undefined,
  permissions: readonly TPermission[]
): boolean => {
  const role = roleOf(actor)
  return role !== null && hasAnyPermission(role, permissions)
}

const canAll = (
  actor: TActor | null | undefined,
  permissions: readonly TPermission[]
): boolean => {
  const role = roleOf(actor)
  return role !== null && hasAllPermissions(role, permissions)
}

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'] as const

/**
 * Roles this actor may assign — when creating an account
 * (`USERS_CREATE`, the default) or when changing an existing one's role
 * (`USERS_UPDATE_ROLE`).
 *
 * Anyone below SUPER_ADMIN may only assign roles strictly junior to their own,
 * so an ADMIN can neither bootstrap a peer nor promote anyone past themselves.
 */
const assignableRoles = (
  actor: TActor | null | undefined,
  permission: TPermission = PERMISSIONS.USERS_CREATE
): TUserRoleValue[] => {
  const role = roleOf(actor)
  if (role === null || !hasPermission(role, permission)) return []
  if (role === 'SUPER_ADMIN') return [...ALL_ROLES]
  return ALL_ROLES.filter((candidate) => ROLE_RANK[candidate] < ROLE_RANK[role])
}

const isSelfProtected = (permission: TPermission): boolean =>
  (SELF_PROTECTED_PERMISSIONS as readonly TPermission[]).includes(permission)

const isReadOnly = (permission: TPermission): boolean =>
  (READ_ONLY_PERMISSIONS as readonly TPermission[]).includes(permission)

/**
 * Resource-level authorization: may this actor exercise `permission` *against
 * this particular target*?
 *
 * Holding a permission is necessary but not sufficient — this is the guard
 * against the IDOR class of bug the Next.js data-security guide calls out.
 * Rules, in order:
 *
 * 1. the actor must hold the permission;
 * 2. destructive and privilege-changing actions never apply to oneself;
 * 3. read-only permissions stop here — listing a record already exposes it;
 * 4. an actor may only act on someone strictly junior to them, except that a
 *    SUPER_ADMIN may act on other SUPER_ADMINs (someone has to be able to);
 * 5. granting or revoking SUPER_ADMIN is SUPER_ADMIN-only, which falls out of
 *    (4) plus `assignableRoles`.
 */
const canActOnUser = (
  actor: TActor | null | undefined,
  target: TTarget,
  permission: TPermission
): boolean => explainDenial(actor, target, permission) === null

/**
 * The same rules as `canActOnUser`, but returning *why* the action is
 * unavailable so a disabled control can explain itself instead of being
 * silently dead. `null` means allowed.
 */
const explainDenial = (
  actor: TActor | null | undefined,
  target: TTarget,
  permission: TPermission
): string | null => {
  const actorRole = roleOf(actor)
  if (actor === null || actor === undefined || actorRole === null) {
    return 'You are not signed in.'
  }

  if (!hasPermission(actorRole, permission)) {
    return 'Your role does not allow this action.'
  }

  if (actor.id === target.id) {
    return isSelfProtected(permission)
      ? 'You cannot perform this action on your own account.'
      : // Non-destructive actions on one's own record are always fine; the
        // seniority rule below would otherwise reject an ADMIN editing itself.
        null
  }

  // Reading is not an escalation — see `READ_ONLY_PERMISSIONS`.
  if (isReadOnly(permission)) return null

  const targetRole = readUserRole(target.role)
  const outranked = ROLE_RANK[targetRole] >= ROLE_RANK[actorRole]
  if (outranked && actorRole !== 'SUPER_ADMIN') {
    return targetRole === actorRole
      ? 'You cannot act on another account with the same role.'
      : 'You cannot act on an account with a higher role.'
  }

  return null
}

export {
  assignableRoles,
  can,
  canActOnUser,
  canAll,
  canAny,
  explainDenial,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  permissionsForRole,
  roleOf,
  type TActor,
  type TTarget,
}
