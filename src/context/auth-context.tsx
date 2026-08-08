'use client'

import { logoutUser } from '@/app/actions/auth'
import type { IUser } from '@/types/user.types'
import * as React from 'react'

interface AuthContextValue {
  user: IUser | null
  isLoggedIn: boolean
  logout: typeof logoutUser
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

  const logout = React.useCallback(async () => {
    const result = await logoutUser()
    if (result.success) {
      setUser(null)
    }
    return result
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      logout,
    }),
    [user, logout]
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
