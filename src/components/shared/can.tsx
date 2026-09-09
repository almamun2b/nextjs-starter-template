'use client'

import type { TPermission } from '@/constant/permissions'
import { useAuth } from '@/providers/auth-provider'
import type { TTarget } from '@/lib/auth/permissions'
import type { ReactNode } from 'react'

/*
 * Cosmetic permission gate.
 *
 * `<Can>` decides what to *show*; `requirePermission` in
 * `src/lib/auth/dal.ts` decides what is *allowed*. Never let this be the only
 * thing standing between a user and an action — the Server Action behind the
 * button is a separate entry point and guards itself.
 */

interface CanProps {
  /** A single permission. Mutually exclusive with `permissions`. */
  permission?: TPermission
  /** Several permissions, combined per `mode`. */
  permissions?: readonly TPermission[]
  /** How to combine `permissions`. Defaults to `'all'`. */
  mode?: 'any' | 'all'
  /** Also require the ability against this specific record. */
  target?: TTarget
  /** Rendered when the check fails. Defaults to nothing. */
  fallback?: ReactNode
  children: ReactNode
}

function Can({
  permission,
  permissions,
  mode = 'all',
  target,
  fallback = null,
  children,
}: CanProps) {
  const allowed = useCan({ permission, permissions, mode, target })
  return <>{allowed ? children : fallback}</>
}

type TUseCanOptions = Pick<
  CanProps,
  'permission' | 'permissions' | 'mode' | 'target'
>

/** The same check as `<Can>`, for logic that isn't a subtree. */
function useCan({
  permission,
  permissions,
  mode = 'all',
  target,
}: TUseCanOptions): boolean {
  const { can, canAny, canAll, canActOn } = useAuth()

  const list = permissions ?? (permission ? [permission] : [])
  if (list.length === 0) return false

  const holdsPermission =
    list.length === 1
      ? can(list[0])
      : mode === 'any'
        ? canAny(list)
        : canAll(list)

  if (!holdsPermission) return false
  if (!target) return true

  // With a target, every listed permission must also survive the record-level
  // policy — `mode` only governs which permissions are required at all.
  return mode === 'any'
    ? list.some((entry) => canActOn(target, entry))
    : list.every((entry) => canActOn(target, entry))
}

export { Can, useCan, type CanProps }
