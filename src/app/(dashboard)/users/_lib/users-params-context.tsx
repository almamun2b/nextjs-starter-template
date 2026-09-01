'use client'

import { revalidateUsers } from '@/app/actions/user'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  createContext,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from 'react'

/** `undefined` or `''` removes the key, keeping default-valued URLs clean. */
export type TParamPatch = Record<string, string | number | undefined>

interface TUsersParamsValue {
  /** True while a query change is in flight — drives the table's skeleton. */
  isPending: boolean
  applyPatch: (patch: TParamPatch) => void
  refresh: () => void
}

const UsersParamsContext = createContext<TUsersParamsValue | null>(null)

/**
 * Shares one transition between the toolbar and the table.
 *
 * The toolbar (search/filters) and the table (sorting/pagination) both trigger
 * navigations, so a single shared `isPending` is what lets a search started in
 * the toolbar render the skeleton inside the table.
 */
export function UsersParamsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const value = useMemo<TUsersParamsValue>(() => {
    const applyPatch = (patch: TParamPatch) => {
      const next = new URLSearchParams(searchParams.toString())

      for (const [key, entry] of Object.entries(patch)) {
        if (entry === undefined || entry === '') {
          next.delete(key)
        } else {
          next.set(key, String(entry))
        }
      }

      const query = next.toString()
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        })
      })
    }

    /**
     * Bust the cache tag first — `router.refresh()` alone re-runs the render
     * but can still be handed the tag-cached `getAllUsers` response.
     */
    const refresh = () => {
      startTransition(async () => {
        await revalidateUsers()
        router.refresh()
      })
    }

    return { isPending, applyPatch, refresh }
  }, [isPending, pathname, router, searchParams])

  return (
    <UsersParamsContext.Provider value={value}>
      {children}
    </UsersParamsContext.Provider>
  )
}

export function useUsersParams(): TUsersParamsValue {
  const value = useContext(UsersParamsContext)
  if (!value) {
    throw new Error('useUsersParams must be used within a UsersParamsProvider')
  }
  return value
}
