import {
  CursorSortDirection,
  IMeta,
  IResponse,
  SortOrder,
} from './response.types'

enum UserRole {
  SUPER_ADMIN,
  ADMIN,
  USER,
}

enum UserStatus {
  PENDING,
  ACTIVE,
  INACTIVE,
  SUSPENDED,
  BANNED,
  DELETED,
}

enum Gender {
  MALE,
  FEMALE,
  OTHER,
  PREFER_NOT_TO_SAY,
}

interface IAvatar {
  createdAt: Date
  updatedAt: Date
  id: string
  width: number | null
  height: number | null
  url: string
  size: number | null
}

interface IUser {
  email: string
  firstName: string | null
  lastName: string | null
  gender: Gender | null
  phone: string | null
  bio: string | null
  address: string | null
  dateOfBirth: Date | null
  timezone: string | null
  locale: string | null
  role: UserRole
  status: UserStatus
  username: string | null
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  id: string
  verifiedAt: Date | null
  deletedAt: Date | null
  avatar: IAvatar | null
}

type TUsersResponse = IResponse & {
  data: IUser[]
  meta: IMeta
}

type TUserResponse = IResponse & {
  data: IUser
}

type TUserDeleteResponse = IResponse & {
  data: {
    id: string
    email: string
  }
}

type TUserQueryOptions = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
  cursor?: string
  direction?: CursorSortDirection
  searchTerm?: string
  role?: UserRole
  status?: UserStatus
  isVerified?: boolean
  gender?: Gender
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string
  dateOfBirth?: string
  createdAtFrom?: string
  createdAtTo?: string
  lastLoginAtFrom?: string
  lastLoginAtTo?: string
  dateOfBirthFrom?: string
  dateOfBirthTo?: string
  avatarSizeMin?: number
  avatarSizeMax?: number
}

type UpdateAvatarInput = {
  avatar: File
}

type TUpdateProfileInput = {
  firstName?: string | null
  lastName?: string | null
  gender?: Gender | null
  phone?: string | null
  bio?: string | null
  address?: string | null
  dateOfBirth?: string | null
  timezone?: string | null
  locale?: string | null
}

type TUpdateProfileWithAvatarInput = TUpdateProfileInput & UpdateAvatarInput

type TCreateUserInput = {
  email: string
  password: string
  username?: string
  role?: UserRole
  status?: UserStatus
  firstName?: string
  lastName?: string
  gender?: Gender
  phone?: string
}

type TUpdateStatusInput = {
  status: UserStatus
}

type TUpdateRoleInput = {
  role: UserRole
}

type TChangePasswordInput = {
  oldPassword: string
  newPassword: string
}

export type {
  Gender,
  IAvatar,
  IUser,
  TChangePasswordInput,
  TCreateUserInput,
  TUpdateProfileInput,
  TUpdateProfileWithAvatarInput,
  TUpdateRoleInput,
  TUpdateStatusInput,
  TUserDeleteResponse,
  TUserQueryOptions,
  TUserResponse,
  TUsersResponse,
  UpdateAvatarInput,
  UserRole,
  UserStatus,
}
