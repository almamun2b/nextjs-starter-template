'use client'

import { Checkbox } from '@/components/ui/checkbox'
import {
  TableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { TABLE_HEAD_HEIGHT_CLASS } from './constants'
import { type TTableColumn, type TTableSortState } from './types'

export type TSelectAllState = 'none' | 'some' | 'all'

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

interface DataTableHeaderProps<TRow> {
  columns: TTableColumn<TRow>[]
  sort: TTableSortState
  onSortChange: (key: string) => void
  selectAllState: TSelectAllState
  onToggleSelectAll: (checked: boolean) => void
  hasSelectableRows: boolean
}

export function DataTableHeader<TRow>({
  columns,
  sort,
  onSortChange,
  selectAllState,
  onToggleSelectAll,
  hasSelectableRows,
}: DataTableHeaderProps<TRow>) {
  return (
    <UiTableHeader className="sticky top-0 z-10 bg-card">
      <UiTableRow className="hover:bg-transparent">
        {columns.map((column) => {
          const align = alignClass[column.align ?? 'left']

          if (column.kind === 'select') {
            return (
              <TableHead
                key={column.key}
                className={cn(
                  TABLE_HEAD_HEIGHT_CLASS,
                  'px-3',
                  column.headerClassName
                )}
              >
                <Checkbox
                  checked={
                    selectAllState === 'all'
                      ? true
                      : selectAllState === 'some'
                        ? 'indeterminate'
                        : false
                  }
                  disabled={!hasSelectableRows}
                  onCheckedChange={(checked) =>
                    onToggleSelectAll(checked === true)
                  }
                  aria-label="Select all rows on this page"
                />
              </TableHead>
            )
          }

          const isSortable =
            column.kind !== 'action' && column.sortable === true

          if (!isSortable) {
            return (
              <TableHead
                key={column.key}
                className={cn(
                  TABLE_HEAD_HEIGHT_CLASS,
                  'px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase',
                  align,
                  column.headerClassName
                )}
              >
                {column.label}
              </TableHead>
            )
          }

          const isActive = sort.sortBy === column.key
          const isAscending = isActive && sort.sortOrder === 'asc'

          return (
            <TableHead
              key={column.key}
              aria-sort={
                isActive ? (isAscending ? 'ascending' : 'descending') : 'none'
              }
              className={cn(
                TABLE_HEAD_HEIGHT_CLASS,
                'px-3',
                align,
                column.headerClassName
              )}
            >
              <button
                type="button"
                onClick={() => onSortChange(column.key)}
                className={cn(
                  'group inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-xs font-medium tracking-wide uppercase transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <span>{column.label}</span>
                {isActive ? (
                  isAscending ? (
                    <ChevronUpIcon className="size-3.5 text-primary" />
                  ) : (
                    <ChevronDownIcon className="size-3.5 text-primary" />
                  )
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex flex-col -space-y-[3px] text-muted-foreground/60 transition-colors group-hover:text-primary"
                  >
                    <ChevronUpIcon className="size-3" />
                    <ChevronDownIcon className="size-3" />
                  </span>
                )}
              </button>
            </TableHead>
          )
        })}
      </UiTableRow>
    </UiTableHeader>
  )
}
