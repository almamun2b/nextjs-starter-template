'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { type TFilterOption } from './types'

/** Radix `Select` forbids an empty item value, so "All" needs a sentinel. */
const ALL_VALUE = '__all__'

export interface FilterDropdownProps {
  name: string
  /** Label for the default option, e.g. "All roles". */
  allLabel: string
  options: readonly TFilterOption[]
  /** `null` means the "All" option is selected. */
  value: string | null
  onChange: (name: string, value: string | null) => void
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

/**
 * Reusable "All …" select. Used by `DataTableToolbar`, but standalone-safe —
 * it knows nothing about tables or the URL.
 */
export function FilterDropdown({
  name,
  allLabel,
  options,
  value,
  onChange,
  disabled = false,
  ariaLabel,
  className,
}: FilterDropdownProps) {
  return (
    <Select
      value={value ?? ALL_VALUE}
      disabled={disabled}
      onValueChange={(next) => onChange(name, next === ALL_VALUE ? null : next)}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel ?? allLabel}
        className={cn('w-auto min-w-36', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
