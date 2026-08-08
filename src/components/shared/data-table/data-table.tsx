'use client'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { flexRender, type Table as TTable } from '@tanstack/react-table'

interface DataTableProps<TData> {
  table: TTable<TData>
  isLoading?: boolean
  emptyMessage?: string
}

/**
 * Presentational table shell for a caller-owned `useReactTable` instance.
 * Sorting/pagination/filtering are expected to be handled manually by the
 * caller (server-driven) — this component only renders headers/rows.
 */
export function DataTable<TData>({
  table,
  isLoading = false,
  emptyMessage = 'No results found.',
}: DataTableProps<TData>) {
  'use no memo'
  // React Compiler auto-memoizes this component's output based on prop
  // reference equality, but `table` is a stable mutable object (tanstack
  // mutates it in place via `setOptions` rather than replacing it), so a
  // memoized render would never reflect sort/data changes. Opt out.

  const columnCount = table.getAllLeafColumns().length
  const rows = table.getRowModel().rows

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={`skeleton-row-${rowIndex}`}>
                {Array.from({ length: columnCount }).map((_, cellIndex) => (
                  <TableCell key={`skeleton-cell-${rowIndex}-${cellIndex}`}>
                    <Skeleton className="h-5 w-full max-w-40" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
