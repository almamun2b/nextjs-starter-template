const USER_ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'USER', label: 'User' },
] as const

const USER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BANNED', label: 'Banned' },
  { value: 'DELETED', label: 'Deleted' },
] as const

const USER_GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const

const USER_VERIFIED_OPTIONS = [
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
] as const

const AVATAR_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

/** Value for the file input's `accept` attribute. */
const AVATAR_ACCEPT_ATTRIBUTE = AVATAR_ACCEPTED_TYPES.join(',')

/**
 * Client-side cap, deliberately below `serverActions.bodySizeLimit` in
 * next.config.ts so the friendly inline message fires before Next rejects the
 * request body with an opaque error.
 */
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

const AVATAR_MAX_LABEL = '2 MB'

/** Allowed `limit` values — also the rows-per-page dropdown. */
const USER_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

const USER_DEFAULT_PAGE_SIZE = 20

/** Whitelist of columns the API may be asked to sort by. */
const USER_SORTABLE_FIELDS = [
  'email',
  'role',
  'status',
  'isVerified',
  'lastLoginAt',
  'createdAt',
] as const

export {
  AVATAR_ACCEPT_ATTRIBUTE,
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_LABEL,
  USER_DEFAULT_PAGE_SIZE,
  USER_GENDER_OPTIONS,
  USER_PAGE_SIZE_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_SORTABLE_FIELDS,
  USER_STATUS_OPTIONS,
  USER_VERIFIED_OPTIONS,
}
