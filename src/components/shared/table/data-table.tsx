'use client'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { type SortOrder } from '@/types/response.types'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { type Column, type DataTableProps } from './types'

function getRowKey<TData>(
  row: TData,
  rowKey: keyof TData | ((row: TData) => string)
): string {
  return typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey])
}

function getCellValue<TData>(row: TData, column: Column<TData>): ReactNode {
  if (column.cell) {
    return column.cell(row)
  }
  if (column.accessorFn) {
    return column.accessorFn(row)
  }
  if (column.accessorKey) {
    const value = row[column.accessorKey as keyof TData]
    return (value as ReactNode) ?? ''
  }
  return ''
}

function getSortIcon(order: SortOrder | undefined): ReactNode {
  if (order === 'asc') return <ChevronUpIcon className="size-4" />
  if (order === 'desc') return <ChevronDownIcon className="size-4" />
  return (
    <span className="flex size-4 items-center justify-center text-muted-foreground">
      <ChevronUpIcon className="size-3" />
      <ChevronDownIcon className="size-3" />
    </span>
  )
}

interface CheckboxIndeterminateProps extends React.ComponentProps<'input'> {
  indeterminate?: boolean
}

function IndeterminateCheckbox({
  indeterminate,
  ...props
}: CheckboxIndeterminateProps) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate ?? false
    }
  }, [indeterminate])
  return <input type="checkbox" ref={ref} {...props} />
}

export function DataTable<TData extends object>({
  columns,
  data,
  isLoading = false,
  selection = new Set(),
  onSelectionChange,
  onSort,
  sortBy,
  sortOrder,
  rowKey,
  emptyMessage = 'No data available',
  showSelectionColumn = false,
  className,
}: DataTableProps<TData>) {
  const isInitialLoad = data === null || data === undefined
  const isEmpty = Array.isArray(data) && data.length === 0
  const showLoading = isLoading || isInitialLoad
  const dataArray = Array.isArray(data) ? data : []

  const allSelected =
    dataArray.length > 0 &&
    dataArray.every((row) => selection.has(getRowKey(row, rowKey)))
  const someSelected =
    dataArray.some((row) => selection.has(getRowKey(row, rowKey))) &&
    !allSelected

  const handleSelectAll = () => {
    if (!onSelectionChange) return
    const newSelection = new Set(selection)
    if (allSelected) {
      dataArray.forEach((row) => newSelection.delete(getRowKey(row, rowKey)))
    } else {
      dataArray.forEach((row) => newSelection.add(getRowKey(row, rowKey)))
    }
    onSelectionChange(newSelection)
  }

  const handleRowSelect = (row: TData) => {
    if (!onSelectionChange) return
    const id = getRowKey(row, rowKey)
    const newSelection = new Set(selection)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    onSelectionChange(newSelection)
  }

  const handleSort = (key: string) => {
    if (!onSort) return
    let newOrder: SortOrder = 'asc'
    if (sortBy === key && sortOrder === 'asc') {
      newOrder = 'desc'
    }
    onSort(key, newOrder)
  }

  const visibleColumns = showSelectionColumn
    ? [{ key: 'selection', header: '', width: '48px' }, ...columns]
    : columns

  return (
    <div className={cn('w-full', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.headerClassName,
                  column.enableSorting &&
                    onSort &&
                    'cursor-pointer select-none hover:bg-muted/50',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.key === 'selection' && 'w-12'
                )}
                style={column.width ? { width: column.width } : undefined}
                onClick={() =>
                  column.enableSorting && onSort && handleSort(column.key)
                }
              >
                {column.key === 'selection' ? (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="translate-y-0.5"
                  >
                    {someSelected && (
                      <IndeterminateCheckbox aria-hidden="true" />
                    )}
                  </Checkbox>
                ) : (
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {column.enableSorting &&
                      onSort &&
                      sortBy === column.key &&
                      getSortIcon(sortOrder)}
                  </div>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {showLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                {showSelectionColumn && (
                  <TableCell className="w-12">
                    <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                  </TableCell>
                )}
                {columns.map((_, i) => (
                  <TableCell key={i}>
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isEmpty ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            dataArray.map((row) => (
              <TableRow
                key={getRowKey(row, rowKey)}
                className={cn(
                  selection.has(getRowKey(row, rowKey)) && 'bg-muted/50'
                )}
              >
                {showSelectionColumn && (
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selection.has(getRowKey(row, rowKey))}
                      onCheckedChange={() => handleRowSelect(row)}
                      aria-label="Select row"
                      className="translate-y-0.5"
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      column.className,
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {getCellValue(row, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
