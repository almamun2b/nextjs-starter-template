import { type ReactNode } from 'react'
import { type SortOrder } from '@/types/response.types'

export interface Column<TData> {
  key: string
  header: string
  accessorKey?: keyof TData | string
  accessorFn?: (row: TData) => ReactNode
  cell?: (row: TData) => ReactNode
  enableSorting?: boolean
  width?: string
  minWidth?: string
  maxWidth?: string
  className?: string
  headerClassName?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<TData> {
  columns: Column<TData>[]
  data: TData[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPage: number
  }
  isLoading?: boolean
  selection?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
  onSort?: (key: string, order: SortOrder) => void
  sortBy?: string
  sortOrder?: SortOrder
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  rowKey: keyof TData | ((row: TData) => string)
  emptyMessage?: string
  loadingMessage?: string
  showSelectionColumn?: boolean
  className?: string
}

export interface TablePaginationProps {
  meta: {
    page: number
    limit: number
    total: number
    totalPage: number
  }
  selectedCount?: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export type { SortOrder }
