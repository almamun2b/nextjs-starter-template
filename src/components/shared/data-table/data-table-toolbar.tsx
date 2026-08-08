'use client'

import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DataTableToolbarProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  searchPlaceholder?: string
  /** Filter controls (e.g. `Select`s) rendered next to the search input. */
  filters?: React.ReactNode
  /** Right-aligned actions (e.g. "Add user" button). */
  actions?: React.ReactNode
}

export function DataTableToolbar({
  searchTerm,
  onSearchTermChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
}: DataTableToolbarProps) {
  const [value, setValue] = useState(searchTerm)
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm)
  const debouncedValue = useDebouncedValue(value, 400)

  // Re-sync when `searchTerm` changes externally (e.g. browser back/forward).
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm)
    setValue(searchTerm)
  }

  useEffect(() => {
    if (debouncedValue !== searchTerm) {
      onSearchTermChange(debouncedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8"
          />
        </div>
        {filters}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
