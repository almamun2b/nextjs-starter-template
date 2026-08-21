const CACHE_TAGS = {
  PROFILE: 'profile',
  USERS: 'users',
  USER: (id: string) => `user-${id}`,
} as const

export { CACHE_TAGS }
