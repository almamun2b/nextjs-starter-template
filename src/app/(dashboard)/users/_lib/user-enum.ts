import {
  readUserRole,
  type TUserGenderValue,
  type TUserRoleValue,
  type TUserStatusValue,
} from '@/lib/user-format'
import { type Gender, type UserRole, type UserStatus } from '@/types/enum.types'
import { type IUser } from '@/types/user.types'

/*
 * ---------------------------------------------------------------------------
 * Enum wire-format adapter — users feature only.
 *
 * Reading and labelling now lives in `@/lib/user-format` (shared with the
 * profile UI). What stays here are the *write*-direction casts: the action
 * signatures declare the numeric `UserRole`/`UserStatus`/`Gender` enums while
 * the API expects their string keys. Keeping those casts confined to this
 * module is the whole point of it — do not promote them to `src/lib`.
 * ---------------------------------------------------------------------------
 */

/** Cast a string role back to the enum type the action signatures declare. */
const toRoleParam = (value: TUserRoleValue): UserRole =>
  value as unknown as UserRole

/** Cast a string status back to the enum type the action signatures declare. */
const toStatusParam = (value: TUserStatusValue): UserStatus =>
  value as unknown as UserStatus

/** Cast a string gender back to the enum type the action signatures declare. */
const toGenderParam = (value: TUserGenderValue): Gender =>
  value as unknown as Gender

/** `updateUserRole` and `deleteUserHard` are super-admin-only endpoints. */
const isSuperAdmin = (user: IUser | null): boolean =>
  user !== null && readUserRole(user.role) === 'SUPER_ADMIN'

export { isSuperAdmin, toGenderParam, toRoleParam, toStatusParam }

// Re-exported so existing users-feature imports keep resolving from one place.
export {
  getGenderLabel,
  getRoleBadgeVariant,
  getRoleLabel,
  getStatusBadgeVariant,
  getStatusLabel,
  readUserGender,
  readUserRole,
  readUserStatus,
} from '@/lib/user-format'
export type {
  TBadgeVariant,
  TUserGenderValue,
  TUserRoleValue,
  TUserStatusValue,
} from '@/lib/user-format'
