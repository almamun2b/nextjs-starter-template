import type { TUserRoleValue } from '@/lib/user-format'

/**
 * The application's permission catalog.
 *
 * Every entry maps to exactly one capability the UI can gate on and one or
 * more Server Actions that must enforce it. Adding a capability means adding
 * it here first — `TPermission` is a closed union, so a typo anywhere in the
 * app is a compile error rather than a silent `false`.
 *
 * Naming is `<resource>:<action>[:<qualifier>]`.
 */
const PERMISSIONS = {
  /** Read the user directory and individual user records. */
  USERS_READ: 'users:read',
  /** Create a user account from the admin UI. */
  USERS_CREATE: 'users:create',
  /** Edit another user's profile fields. */
  USERS_UPDATE: 'users:update',
  /** Change another user's account status. */
  USERS_UPDATE_STATUS: 'users:update:status',
  /** Change another user's role. */
  USERS_UPDATE_ROLE: 'users:update:role',
  /** Soft-delete another user. */
  USERS_DELETE: 'users:delete',
  /** Irreversibly delete another user. */
  USERS_DELETE_HARD: 'users:delete:hard',

  /** Read one's own profile. */
  PROFILE_READ: 'profile:read',
  /** Edit one's own profile, including the avatar. */
  PROFILE_UPDATE: 'profile:update',
  /** Change one's own password. */
  PROFILE_PASSWORD: 'profile:password',
  /** Deactivate or reactivate one's own account. */
  PROFILE_DEACTIVATE: 'profile:deactivate',

  /** View the dashboard landing page. */
  DASHBOARD_READ: 'dashboard:read',
  /** View the settings page. */
  SETTINGS_READ: 'settings:read',
} as const

type TPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Every permission every signed-in account holds, whatever its role. */
const SELF_SERVICE_PERMISSIONS = [
  PERMISSIONS.PROFILE_READ,
  PERMISSIONS.PROFILE_UPDATE,
  PERMISSIONS.PROFILE_PASSWORD,
  PERMISSIONS.PROFILE_DEACTIVATE,
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.SETTINGS_READ,
] as const satisfies readonly TPermission[]

/**
 * Role → permissions. Deliberately explicit rather than a `'*'` wildcard for
 * SUPER_ADMIN: an auditor should be able to read this table and know exactly
 * what each role can do, and adding a permission should force a decision about
 * every role rather than silently granting it to one of them.
 *
 * This mirrors the backend's own rules — it is the frontend's copy of the
 * contract, not the source of truth. The API stays the final authority.
 */
const ROLE_PERMISSIONS: Record<TUserRoleValue, readonly TPermission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_UPDATE_STATUS,
    PERMISSIONS.USERS_DELETE,
    ...SELF_SERVICE_PERMISSIONS,
  ],
  USER: [...SELF_SERVICE_PERMISSIONS],
}

/**
 * Seniority ladder, used for resource-level checks: an actor may only act on
 * a target strictly below them (SUPER_ADMIN excepted — see `canActOnUser`).
 */
const ROLE_RANK: Record<TUserRoleValue, number> = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  USER: 1,
}

/**
 * Read-only permissions. These skip the seniority rule in `canActOnUser`:
 * if a viewer is allowed to list a record at all, being able to open it is not
 * an escalation, and hiding the detail view of a row they can already read in
 * the table would be theatre rather than security.
 */
const READ_ONLY_PERMISSIONS = [
  PERMISSIONS.USERS_READ,
  PERMISSIONS.PROFILE_READ,
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.SETTINGS_READ,
] as const satisfies readonly TPermission[]

/** Permissions that must never be exercised against one's own account. */
const SELF_PROTECTED_PERMISSIONS = [
  PERMISSIONS.USERS_UPDATE_ROLE,
  PERMISSIONS.USERS_UPDATE_STATUS,
  PERMISSIONS.USERS_DELETE,
  PERMISSIONS.USERS_DELETE_HARD,
] as const satisfies readonly TPermission[]

export {
  PERMISSIONS,
  READ_ONLY_PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_RANK,
  SELF_PROTECTED_PERMISSIONS,
  SELF_SERVICE_PERMISSIONS,
  type TPermission,
}
