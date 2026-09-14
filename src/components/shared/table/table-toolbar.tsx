'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { RefreshCwIcon, SearchIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FilterDropdown } from './filter-dropdown'
import { type TFilterConfig, type TToolbarChangeEvent } from './types'

export interface DataTableToolbarProps {
  search: string
  filters: Record<string, string | null>
  filterConfigs?: readonly TFilterConfig[]
  onChange: (event: TToolbarChangeEvent) => void
  searchPlaceholder?: string
  /** Drives the refresh button's spinner and disables inputs mid-navigation. */
  isPending?: boolean
  /** Right-aligned slot, e.g. an "Add user" button. */
  actions?: ReactNode
  /** Reserved for a future CSV/Excel export — hidden unless enabled. */
  exportEnabled?: boolean
  onExport?: () => void
  className?: string
}

export function DataTableToolbar({
  search,
  filters,
  filterConfigs = [],
  onChange,
  searchPlaceholder = 'Search...',
  isPending = false,
  actions,
  exportEnabled = false,
  onExport,
  className,
}: DataTableToolbarProps) {
  const [searchInput, setSearchInput] = useState(search)
  const [prevSearch, setPrevSearch] = useState(search)
  const debouncedSearch = useDebounce(searchInput, { delayMs: 400 })

  // Re-sync when `search` changes externally (browser back/forward, clear).
  if (search !== prevSearch) {
    setPrevSearch(search)
    setSearchInput(search)
  }

  // Keep the latest callback/filters in refs so the debounce effect below
  // depends only on the debounced value, never on a fresh closure identity.
  const onChangeRef = useRef(onChange)
  const filtersRef = useRef(filters)
  useEffect(() => {
    onChangeRef.current = onChange
    filtersRef.current = filters
  })

  useEffect(() => {
    if (debouncedSearch !== search) {
      onChangeRef.current({
        search: debouncedSearch,
        filters: filtersRef.current,
      })
    }
  }, [debouncedSearch, search])

  const hasActiveFilters =
    search.length > 0 ||
    Object.values(filters).some((value) => value !== null && value !== '')

  const handleFilterChange = (name: string, value: string | null) => {
    onChange({ search, filters: { ...filters, [name]: value } })
  }

  const handleClear = () => {
    const cleared: Record<string, string | null> = {}
    for (const key of Object.keys(filters)) cleared[key] = null
    setSearchInput('')
    onChange({ search: '', filters: cleared })
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b px-4 py-3 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-8 pl-8"
          />
        </div>

        {filterConfigs.map((config) => (
          <FilterDropdown
            key={config.name}
            name={config.name}
            allLabel={config.allLabel}
            options={config.options}
            ariaLabel={config.ariaLabel}
            className={config.className}
            value={filters[config.name] ?? null}
            onChange={handleFilterChange}
          />
        ))}

        {/* Always occupies its slot — toggling visibility instead of mounting
            keeps the toolbar from re-wrapping and shifting the table down. */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          aria-hidden={!hasActiveFilters}
          tabIndex={hasActiveFilters ? undefined : -1}
          className={cn(!hasActiveFilters && 'pointer-events-none invisible')}
        >
          <XIcon className="size-3.5" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {exportEnabled && onExport && (
          <Button type="button" variant="outline" size="sm" onClick={onExport}>
            Export
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() =>
            onChange({ search, filters, action: { type: 'refresh' } })
          }
          disabled={isPending}
          aria-label="Refresh"
        >
          <RefreshCwIcon
            className={cn('size-3.5', isPending && 'animate-spin')}
          />
        </Button>
        {actions}
      </div>
    </div>
  )
}
