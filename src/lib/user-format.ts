import {
  USER_GENDER_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
} from '@/constant/user'
import { normalizeEnumValue } from '@/lib/enum'
import { Gender, UserRole, UserStatus } from '@/types/enum.types'
import { type IUser } from '@/types/user.types'

export type TUserRoleValue = (typeof USER_ROLE_OPTIONS)[number]['value']
export type TUserStatusValue = (typeof USER_STATUS_OPTIONS)[number]['value']
export type TUserGenderValue = (typeof USER_GENDER_OPTIONS)[number]['value']

export type TBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

/*
 * `UserRole` / `UserStatus` / `Gender` are declared as numeric TS enums, but the
 * API sends their string keys ("ADMIN", "ACTIVE"). `normalizeEnumValue` handles
 * both shapes, so these readers stay correct whichever form arrives.
 */

const readUserRole = (role: IUser['role']): TUserRoleValue =>
  (normalizeEnumValue(UserRole, role) ?? 'USER') as TUserRoleValue

const readUserStatus = (status: IUser['status']): TUserStatusValue =>
  (normalizeEnumValue(UserStatus, status) ?? 'PENDING') as TUserStatusValue

const readUserGender = (gender: IUser['gender']): TUserGenderValue | null =>
  (normalizeEnumValue(Gender, gender) as TUserGenderValue | undefined) ?? null

const roleLabels = new Map<string, string>(
  USER_ROLE_OPTIONS.map((option) => [option.value, option.label])
)
const statusLabels = new Map<string, string>(
  USER_STATUS_OPTIONS.map((option) => [option.value, option.label])
)
const genderLabels = new Map<string, string>(
  USER_GENDER_OPTIONS.map((option) => [option.value, option.label])
)

const getRoleLabel = (role: IUser['role']): string => {
  const value = readUserRole(role)
  return roleLabels.get(value) ?? value
}

const getStatusLabel = (status: IUser['status']): string => {
  const value = readUserStatus(status)
  return statusLabels.get(value) ?? value
}

const getGenderLabel = (gender: IUser['gender']): string | null => {
  const value = readUserGender(gender)
  return value === null ? null : (genderLabels.get(value) ?? value)
}

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

/** Full name when we have one, otherwise the email local part. */
const getUserDisplayName = (user: IUser): string => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  if (name.length > 0) return name
  return user.email.split('@')[0]
}

const getUserInitials = (user: IUser): string => {
  if (user.firstName && user.lastName) {
    return (user.firstName[0] + user.lastName[0]).toUpperCase()
  }
  if (user.firstName) return user.firstName.slice(0, 2).toUpperCase()
  return user.email.slice(0, 2).toUpperCase()
}

export {
  getGenderLabel,
  getRoleBadgeVariant,
  getRoleLabel,
  getStatusBadgeVariant,
  getStatusLabel,
  getUserDisplayName,
  getUserInitials,
  readUserGender,
  readUserRole,
  readUserStatus,
}
