import {
  USER_GENDER_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
} from '@/constant/user'
import { type Gender, type UserRole, type UserStatus } from '@/types/enum.types'
import { type IUser } from '@/types/user.types'

export type TUserRoleValue = (typeof USER_ROLE_OPTIONS)[number]['value']
export type TUserStatusValue = (typeof USER_STATUS_OPTIONS)[number]['value']
export type TUserGenderValue = (typeof USER_GENDER_OPTIONS)[number]['value']

/*
 * ---------------------------------------------------------------------------
 * Enum wire-format adapter
 *
 * `UserRole` / `UserStatus` are declared in `@/types/enum.types` as *numeric*
 * TypeScript enums, but the API both sends and expects their *string* keys
 * ("ADMIN", "ACTIVE"). Rather than scatter `String(...)` and `as unknown as`
 * across the feature, every cast bridging that gap lives in this one module —
 * so the rest of the users code works in plain, well-typed strings.
 * ---------------------------------------------------------------------------
 */

/** Read a user's role as the string value the API actually sends. */
const readUserRole = (role: IUser['role']): TUserRoleValue =>
  String(role) as TUserRoleValue

/** Read a user's status as the string value the API actually sends. */
const readUserStatus = (status: IUser['status']): TUserStatusValue =>
  String(status) as TUserStatusValue

/** Cast a string role back to the enum type the action signatures declare. */
const toRoleParam = (value: TUserRoleValue): UserRole =>
  value as unknown as UserRole

/** Cast a string status back to the enum type the action signatures declare. */
const toStatusParam = (value: TUserStatusValue): UserStatus =>
  value as unknown as UserStatus

/** Read a user's gender as the string value the API actually sends. */
const readUserGender = (gender: IUser['gender']): TUserGenderValue | null =>
  gender === null || gender === undefined
    ? null
    : (String(gender) as TUserGenderValue)

/** Cast a string gender back to the enum type the action signatures declare. */
const toGenderParam = (value: TUserGenderValue): Gender =>
  value as unknown as Gender

const genderLabels = new Map<string, string>(
  USER_GENDER_OPTIONS.map((option) => [option.value, option.label])
)

const getGenderLabel = (gender: IUser['gender']): string | null => {
  const value = readUserGender(gender)
  return value === null ? null : (genderLabels.get(value) ?? value)
}

const roleLabels = new Map<string, string>(
  USER_ROLE_OPTIONS.map((option) => [option.value, option.label])
)

const statusLabels = new Map<string, string>(
  USER_STATUS_OPTIONS.map((option) => [option.value, option.label])
)

const getRoleLabel = (role: IUser['role']): string => {
  const value = readUserRole(role)
  return roleLabels.get(value) ?? value
}

const getStatusLabel = (status: IUser['status']): string => {
  const value = readUserStatus(status)
  return statusLabels.get(value) ?? value
}

type TBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const statusBadgeVariants: Record<TUserStatusValue, TBadgeVariant> = {
  PENDING: 'secondary',
  ACTIVE: 'default',
  INACTIVE: 'outline',
  SUSPENDED: 'destructive',
  BANNED: 'destructive',
  DELETED: 'outline',
}

const roleBadgeVariants: Record<TUserRoleValue, TBadgeVariant> = {
  SUPER_ADMIN: 'default',
  ADMIN: 'secondary',
  USER: 'outline',
}

const getStatusBadgeVariant = (status: IUser['status']): TBadgeVariant =>
  statusBadgeVariants[readUserStatus(status)] ?? 'outline'

const getRoleBadgeVariant = (role: IUser['role']): TBadgeVariant =>
  roleBadgeVariants[readUserRole(role)] ?? 'outline'

/** `updateUserRole` and `deleteUserHard` are super-admin-only endpoints. */
const isSuperAdmin = (user: IUser | null): boolean =>
  user !== null && readUserRole(user.role) === 'SUPER_ADMIN'

export {
  getGenderLabel,
  getRoleBadgeVariant,
  getRoleLabel,
  getStatusBadgeVariant,
  getStatusLabel,
  isSuperAdmin,
  readUserGender,
  readUserRole,
  readUserStatus,
  toGenderParam,
  toRoleParam,
  toStatusParam,
}
export type { TBadgeVariant }
