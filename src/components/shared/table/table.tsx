'use client'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableRow as UiTableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { InboxIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { TABLE_MIN_WIDTH_CLASS, TABLE_ROW_HEIGHT_CLASS } from './constants'
import { DataTableHeader, type TSelectAllState } from './table-header'
import { DataTableRow } from './table-row'
import {
  type TTableChangeEvent,
  type TTableColumn,
  type TTableSortState,
} from './types'

const EMPTY_SORT: TTableSortState = { sortBy: null, sortOrder: null }

export interface DataTableProps<TRow extends object> {
  columns: TTableColumn<TRow>[]
  rows: TRow[]
  /** Stable unique id per row — used for selection and React keys. */
  rowId: (row: TRow) => string
  sort?: TTableSortState
  selectedIds?: string[]
  onChange?: (event: TTableChangeEvent) => void
  /** Rows a user may not select (e.g. their own account). */
  isRowSelectable?: (row: TRow) => boolean
  isLoading?: boolean
  /** How many skeleton rows to draw while loading. */
  skeletonRows?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  className?: string
}

export function DataTable<TRow extends object>({
  columns,
  rows,
  rowId,
  sort = EMPTY_SORT,
  selectedIds = [],
  onChange,
  isRowSelectable,
  isLoading = false,
  skeletonRows = 10,
  emptyTitle = 'No data available',
  emptyDescription,
  emptyAction,
  className,
}: DataTableProps<TRow>) {
  const selectableRows = rows.filter((row) => isRowSelectable?.(row) ?? true)
  const selectedSet = new Set(selectedIds)
  const selectedOnPage = selectableRows.filter((row) =>
    selectedSet.has(rowId(row))
  ).length

  const selectAllState: TSelectAllState =
    selectableRows.length > 0 && selectedOnPage === selectableRows.length
      ? 'all'
      : selectedOnPage > 0
        ? 'some'
        : 'none'

  const emit = (next: Partial<TTableChangeEvent>) => {
    onChange?.({ sort, selectedIds, ...next })
  }

  const handleSortChange = (key: string) => {
    const sortOrder =
      sort.sortBy === key && sort.sortOrder === 'asc' ? 'desc' : 'asc'
    emit({ sort: { sortBy: key, sortOrder } })
  }

  const handleToggleSelectAll = (checked: boolean) => {
    const pageIds = selectableRows.map(rowId)
    const next = checked
      ? Array.from(new Set([...selectedIds, ...pageIds]))
      : selectedIds.filter((id) => !pageIds.includes(id))
    emit({ selectedIds: next })
  }

  const handleToggleSelectRow = (id: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...selectedIds, id]))
      : selectedIds.filter((selectedId) => selectedId !== id)
    emit({ selectedIds: next })
  }

  return (
    <UiTable className={cn('table-fixed', TABLE_MIN_WIDTH_CLASS, className)}>
      <colgroup>
        {columns.map((column) => (
          <col
            key={column.key}
            style={column.width ? { width: column.width } : undefined}
          />
        ))}
      </colgroup>

      <DataTableHeader
        columns={columns}
        sort={sort}
        onSortChange={handleSortChange}
        selectAllState={selectAllState}
        onToggleSelectAll={handleToggleSelectAll}
        hasSelectableRows={selectableRows.length > 0}
      />

      <TableBody>
        {isLoading ? (
          Array.from({ length: skeletonRows }).map((_, rowIndex) => (
            <UiTableRow key={rowIndex} className={TABLE_ROW_HEIGHT_CLASS}>
              {columns.map((column) => (
                <TableCell key={column.key} className="px-3">
                  <Skeleton
                    className={cn(
                      column.kind === 'select'
                        ? 'size-4 rounded-[4px]'
                        : column.kind === 'action'
                          ? 'ml-auto size-7 rounded-md'
                          : 'h-4 w-full max-w-40'
                    )}
                  />
                </TableCell>
              ))}
            </UiTableRow>
          ))
        ) : rows.length === 0 ? (
          <UiTableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="h-72">
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <InboxIcon className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{emptyTitle}</p>
                  {emptyDescription && (
                    <p className="text-sm text-muted-foreground">
                      {emptyDescription}
                    </p>
                  )}
                </div>
                {emptyAction}
              </div>
            </TableCell>
          </UiTableRow>
        ) : (
          rows.map((row, index) => {
            const id = rowId(row)
            return (
              <DataTableRow
                key={id}
                row={row}
                index={index}
                columns={columns}
                isSelected={selectedSet.has(id)}
                isSelectable={isRowSelectable?.(row) ?? true}
                onToggleSelect={(checked) => handleToggleSelectRow(id, checked)}
              />
            )
          })
        )}
      </TableBody>
    </UiTable>
  )
}
