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

export { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS }
