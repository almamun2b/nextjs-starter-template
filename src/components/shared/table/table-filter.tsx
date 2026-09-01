'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Select as SelectPrimitive } from 'radix-ui'
import { type ReactNode } from 'react'

const ALL_VALUE = 'ALL'

interface TableFilterProps extends Omit<
  React.ComponentProps<typeof SelectPrimitive.Root>,
  'value' | 'onValueChange' | 'className'
> {
  /** Current filter value. `undefined` means "All" is selected. */
  value: string | undefined
  /** Called with the new value, or `undefined` when "All" is selected. */
  onChange: (value: string | undefined) => void
  /** Placeholder text for the SelectValue. */
  placeholder?: string
  /** Label shown for the "All" option. */
  allLabel?: string
  /** Selectable options. */
  options: ReadonlyArray<{ value: string; label: string }>
  /** Custom className for the SelectTrigger. */
  classNameTrigger?: string
  /** Custom className for the SelectContent. */
  classNameContent?: string
  /** Custom className for each SelectItem. */
  classNameSelectItem?: string
  /** Custom className for the SelectValue. */
  classNameSelectValue?: string
  /** Custom className for the root Select. */
  className?: string
  /** Optional label rendered at the top of the SelectContent. */
  label?: ReactNode
  /** Optional className for the label. */
  classNameLabel?: string
  /** Whether to show a separator between the label and options. */
  showSeparator?: boolean
  /** Custom render function for options. */
  renderOption?: (option: { value: string; label: string }) => ReactNode
  /** Full custom children override — renders instead of default options. */
  children?: ReactNode
}

export function TableFilter({
  value,
  onChange,
  placeholder = 'Select...',
  allLabel = 'All',
  options,
  classNameTrigger,
  classNameContent,
  classNameSelectItem,
  classNameSelectValue,
  label,
  classNameLabel,
  showSeparator = false,
  renderOption,
  children,
  ...props
}: TableFilterProps) {
  const selectedValue = value ?? ALL_VALUE

  return (
    <Select
      value={selectedValue}
      onValueChange={(val) => onChange(val === ALL_VALUE ? undefined : val)}
      {...props}
    >
      <SelectTrigger className={cn('cursor-pointer', classNameTrigger)}>
        <SelectValue
          placeholder={placeholder}
          className={classNameSelectValue}
        />
      </SelectTrigger>
      <SelectContent
        className={classNameContent}
        position="popper"
        align="start"
      >
        {label && (
          <>
            <Label
              className={cn('px-2 py-1.25 text-sm font-normal', classNameLabel)}
            >
              {label}
            </Label>
            {showSeparator && <SelectSeparator className="mt-0 pt-0" />}
          </>
        )}
        <SelectItem
          value={ALL_VALUE}
          className={cn('cursor-pointer', classNameSelectItem)}
        >
          {allLabel}
        </SelectItem>
        {children
          ? children
          : options.map((option) =>
              renderOption ? (
                renderOption(option)
              ) : (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={cn('cursor-pointer', classNameSelectItem)}
                >
                  {option.label}
                </SelectItem>
              )
            )}
      </SelectContent>
    </Select>
  )
}
