'use client'

import type { SortOrder } from '@/types/response.types'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

type TQueryParamValue = string | number | null | undefined

interface UseDataTableQueryStateOptions {
  defaultLimit?: number
  defaultSortBy?: string
  defaultSortOrder?: SortOrder
  /** Extra filter keys (besides page/limit/sortBy/sortOrder/searchTerm) to read from the URL. */
  filterKeys?: string[]
}

/**
 * Reads and writes a data table's pagination/sorting/search/filter state to
 * the URL's search params, so the list stays bookmarkable/shareable and any
 * change (search, filter, sort) resets the page back to 1.
 */
export function useDataTableQueryState({
  defaultLimit = 10,
  defaultSortBy,
  defaultSortOrder = 'desc',
  filterKeys = [],
}: UseDataTableQueryStateOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const limit =
    Number(searchParams.get('limit') ?? String(defaultLimit)) || defaultLimit
  const sortBy = searchParams.get('sortBy') ?? defaultSortBy
  const sortOrder =
    (searchParams.get('sortOrder') as SortOrder | null) ?? defaultSortOrder
  const searchTerm = searchParams.get('searchTerm') ?? ''

  const filters: Record<string, string> = {}
  for (const key of filterKeys) {
    const value = searchParams.get(key)
    if (value) filters[key] = value
  }

  const updateParams = useCallback(
    (updates: Record<string, TQueryParamValue>, resetPage = false) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === '') {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      }

      if (resetPage) params.set('page', '1')

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const setPage = useCallback(
    (next: number) => updateParams({ page: next }),
    [updateParams]
  )

  const setLimit = useCallback(
    (next: number) => updateParams({ limit: next }, true),
    [updateParams]
  )

  const setSearchTerm = useCallback(
    (next: string) => updateParams({ searchTerm: next }, true),
    [updateParams]
  )

  const setFilter = useCallback(
    (key: string, value: string | undefined) =>
      updateParams({ [key]: value }, true),
    [updateParams]
  )

  const toggleSort = useCallback(
    (columnId: string) => {
      if (sortBy !== columnId) {
        updateParams({ sortBy: columnId, sortOrder: 'asc' }, true)
        return
      }
      if (sortOrder === 'asc') {
        updateParams({ sortBy: columnId, sortOrder: 'desc' }, true)
        return
      }
      updateParams({ sortBy: undefined, sortOrder: undefined }, true)
    },
    [sortBy, sortOrder, updateParams]
  )

  /** Builds a shareable href for a given page, for `Link`-based pagination controls. */
  const getPageHref = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(targetPage))
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams]
  )

  return {
    page,
    limit,
    sortBy: sortBy ?? undefined,
    sortOrder,
    searchTerm,
    filters,
    setPage,
    setLimit,
    setSearchTerm,
    setFilter,
    toggleSort,
    getPageHref,
  }
}
