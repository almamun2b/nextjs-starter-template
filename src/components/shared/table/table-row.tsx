'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow as UiTableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'
import { TABLE_ROW_HEIGHT_CLASS } from './constants'
import { type TTableColumn } from './types'

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

/**
 * Fallback for `data` columns that declare no `render`: read the matching
 * property off the row and stringify it when it is a primitive.
 */
function readCellValue<TRow extends object>(row: TRow, key: string): ReactNode {
  if (!(key in row)) return '—'

  const value: unknown = Reflect.get(row, key)

  if (value === null || value === undefined || value === '') return '—'
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  return '—'
}

interface DataTableRowProps<TRow extends object> {
  row: TRow
  index: number
  columns: TTableColumn<TRow>[]
  isSelected: boolean
  isSelectable: boolean
  onToggleSelect: (checked: boolean) => void
}

export function DataTableRow<TRow extends object>({
  row,
  index,
  columns,
  isSelected,
  isSelectable,
  onToggleSelect,
}: DataTableRowProps<TRow>) {
  return (
    <UiTableRow
      data-state={isSelected ? 'selected' : undefined}
      className={cn(TABLE_ROW_HEIGHT_CLASS, 'transition-colors')}
    >
      {columns.map((column) => {
        const align = alignClass[column.align ?? 'left']

        if (column.kind === 'select') {
          return (
            <TableCell
              key={column.key}
              className={cn('px-3', column.cellClassName)}
            >
              <Checkbox
                checked={isSelected}
                disabled={!isSelectable}
                onCheckedChange={(checked) => onToggleSelect(checked === true)}
                aria-label="Select row"
              />
            </TableCell>
          )
        }

        return (
          <TableCell
            key={column.key}
            className={cn('truncate px-3', align, column.cellClassName)}
          >
            {column.render
              ? column.render(row, index)
              : readCellValue(row, column.key)}
          </TableCell>
        )
      })}
    </UiTableRow>
  )
}
