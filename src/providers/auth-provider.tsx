'use client'

import type { IUser } from '@/types/user.types'
import * as React from 'react'

interface AuthContextValue {
  user: IUser | null
  isLoggedIn: boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  initialUser: IUser | null
  children: React.ReactNode
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const [user, setUser] = React.useState<IUser | null>(initialUser)
  const [prevInitialUser, setPrevInitialUser] = React.useState<IUser | null>(
    initialUser
  )

  // Re-sync when the server re-fetches the user on navigation.
  if (initialUser !== prevInitialUser) {
    setPrevInitialUser(initialUser)
    setUser(initialUser)
  }

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
