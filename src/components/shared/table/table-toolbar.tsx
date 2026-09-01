'use client'

import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { SearchIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

interface DataTableToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  /** Filter controls (e.g. `Select`s) rendered next to the search input. */
  filters?: ReactNode
  /** Right-aligned actions (e.g. "Add user" button). */
  actions?: ReactNode
  className?: string
  classNameSearchInput?: string
}

export function TableToolbar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  className,
  classNameSearchInput,
}: DataTableToolbarProps) {
  const [searchInput, setSearchInput] = useState(searchTerm)
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm)
  const debouncedValue = useDebounce(searchInput, { delayMs: 400 })

  // Re-sync when `searchTerm` changes externally (e.g. browser back/forward).
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm)
    setSearchInput(searchTerm)
  }

  useEffect(() => {
    if (debouncedValue !== searchTerm) {
      onSearchChange(debouncedValue)
    }
  }, [debouncedValue, onSearchChange, searchTerm])

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className={cn('relative w-full max-w-xs')}>
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={searchPlaceholder}
            className={cn('h-8 pl-8', classNameSearchInput)}
          />
        </div>
        {filters}
      </div>
      {actions}
    </div>
  )
}
