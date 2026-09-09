'use client'

import type { TPermission } from '@/constant/permissions'
import {
  assignableRoles as resolveAssignableRoles,
  can as canPermission,
  canActOnUser,
  canAll as canAllPermissions,
  canAny as canAnyPermissions,
  explainDenial as describeDenial,
  type TTarget,
} from '@/lib/auth/permissions'
import { readUserRole, type TUserRoleValue } from '@/lib/user-format'
import type { IUser } from '@/types/user.types'
import * as React from 'react'

interface AuthContextValue {
  user: IUser | null
  isLoggedIn: boolean
  /** `null` when signed out. */
  role: TUserRoleValue | null
  /** Does the signed-in user hold this permission? */
  can: (permission: TPermission) => boolean
  canAny: (permissions: readonly TPermission[]) => boolean
  canAll: (permissions: readonly TPermission[]) => boolean
  /** May they exercise it against this particular record? */
  canActOn: (target: TTarget, permission: TPermission) => boolean
  /** Why not — for tooltips on disabled controls. `null` means allowed. */
  explainDenial: (target: TTarget, permission: TPermission) => string | null
  /** Roles they may assign, for create/edit-role selects. */
  assignableRoles: (permission?: TPermission) => TUserRoleValue[]
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

  // Every ability here is derived from `user` through the same pure helpers the
  // server guards use, so the UI can never offer an action the DAL will refuse.
  // This is presentation only — hiding a button is not authorization.
  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      role: user ? readUserRole(user.role) : null,
      can: (permission) => canPermission(user, permission),
      canAny: (permissions) => canAnyPermissions(user, permissions),
      canAll: (permissions) => canAllPermissions(user, permissions),
      canActOn: (target, permission) => canActOnUser(user, target, permission),
      explainDenial: (target, permission) =>
        describeDenial(user, target, permission),
      assignableRoles: (permission) => resolveAssignableRoles(user, permission),
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
