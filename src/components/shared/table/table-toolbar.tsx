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

  // Lays out against the *card's* width via container queries, not the
  // viewport: with the sidebar open, a 1024px screen leaves the table only
  // ~780px, which viewport breakpoints would treat as desktop.
  //
  // - narrow:  [search ........ refresh add]
  //            [filter   ] [filter   ]
  //            [filter   ] [clear    ]
  // - @xl:     [search ........ refresh add]
  //            [filter] [filter] [filter] [clear]
  // - @4xl:    [search] [filter] [filter] [filter] [clear] .... [refresh add]
  return (
    <div className={cn('@container border-b', className)}>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <div className="relative min-w-0 flex-1 @4xl:w-64 @4xl:flex-none">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 @4xl:order-last @4xl:ml-auto">
          {exportEnabled && onExport && (
            <Button type="button" variant="outline" onClick={onExport}>
              Export
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              onChange({ search, filters, action: { type: 'refresh' } })
            }
            disabled={isPending}
            aria-label="Refresh"
          >
            <RefreshCwIcon className={cn(isPending && 'animate-spin')} />
          </Button>
          {actions}
        </div>

        {(filterConfigs.length > 0 || hasActiveFilters) && (
          <div className="grid w-full grid-cols-2 gap-2 @xl:flex @xl:flex-wrap @xl:items-center @4xl:w-auto @4xl:flex-nowrap">
            {filterConfigs.map((config) => (
              <FilterDropdown
                key={config.name}
                name={config.name}
                allLabel={config.allLabel}
                options={config.options}
                ariaLabel={config.ariaLabel}
                className={cn('w-full @xl:w-auto', config.className)}
                value={filters[config.name] ?? null}
                onChange={handleFilterChange}
              />
            ))}

            {/* Always occupies its slot — toggling visibility instead of
                mounting keeps the toolbar from re-wrapping and shifting the
                table down. */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              aria-hidden={!hasActiveFilters}
              tabIndex={hasActiveFilters ? undefined : -1}
              className={cn(
                'justify-self-start text-muted-foreground',
                !hasActiveFilters && 'pointer-events-none invisible'
              )}
            >
              <XIcon />
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
