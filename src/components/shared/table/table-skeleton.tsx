import { Skeleton } from '@/components/ui/skeleton'
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  TABLE_HEAD_HEIGHT_CLASS,
  TABLE_MIN_WIDTH_CLASS,
  TABLE_ROW_HEIGHT_CLASS,
} from './constants'
import { type TTableColumnMeta } from './types'

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

interface DataTableSkeletonProps {
  columns: TTableColumnMeta[]
  rows: number
  className?: string
}

/**
 * Server-renderable skeleton that mirrors `DataTable`'s geometry exactly —
 * same `<colgroup>` widths, same header height, same row height, and the same
 * number of rows the real page will render. Swapping it for the loaded table
 * therefore causes no layout shift.
 */
export function DataTableSkeleton({
  columns,
  rows,
  className,
}: DataTableSkeletonProps) {
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
      <UiTableHeader className="bg-card">
        <UiTableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className={cn(
                TABLE_HEAD_HEIGHT_CLASS,
                'px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase',
                alignClass[column.align ?? 'left']
              )}
            >
              {column.kind === 'select' ? (
                <Skeleton className="size-4 rounded-[4px]" />
              ) : (
                column.label
              )}
            </TableHead>
          ))}
        </UiTableRow>
      </UiTableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <UiTableRow key={rowIndex} className={TABLE_ROW_HEIGHT_CLASS}>
            {columns.map((column) => (
              <TableCell key={column.key} className="px-3">
                {column.kind === 'select' ? (
                  <Skeleton className="size-4 rounded-[4px]" />
                ) : column.kind === 'action' ? (
                  <Skeleton className="ml-auto size-7 rounded-md" />
                ) : (
                  <Skeleton className="h-4 w-full max-w-40" />
                )}
              </TableCell>
            ))}
          </UiTableRow>
        ))}
      </TableBody>
    </UiTable>
  )
}
