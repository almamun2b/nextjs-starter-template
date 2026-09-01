import { type IUser } from '@/types/user.types'

/** Full name when we have one, otherwise fall back to the email local part. */
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

export { getUserDisplayName, getUserInitials }
