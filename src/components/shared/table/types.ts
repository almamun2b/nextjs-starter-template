import { type ReactNode } from 'react'
import { type SortOrder } from '@/types/response.types'

export type TSortOrder = SortOrder

export type TTableColumnKind = 'data' | 'select' | 'action'

export type TTableAlign = 'left' | 'center' | 'right'

/**
 * Presentation-only column metadata.
 *
 * Contains no functions, so it can be defined once and shared between a Server
 * Component (skeleton) and a Client Component (live table) — which is what
 * keeps both renderings geometrically identical and avoids layout shift.
 */
export interface TTableColumnMeta {
  key: string
  label: string
  kind?: TTableColumnKind
  sortable?: boolean
  /** Feeds `<colgroup>`; omit on exactly one column to let it absorb slack. */
  width?: string
  align?: TTableAlign
}

/** A full column definition: metadata plus the cell renderer. */
export interface TTableColumn<TRow> extends Omit<TTableColumnMeta, 'label'> {
  label: ReactNode
  headerClassName?: string
  cellClassName?: string
  render?: (row: TRow, index: number) => ReactNode
}

export interface TTableSortState {
  sortBy: string | null
  sortOrder: TSortOrder | null
}

export interface TTableChangeEvent {
  sort: TTableSortState
  selectedIds: string[]
}

export type TPaginationSource = 'page' | 'prev' | 'next' | 'page-size'

export interface TPaginationChangeEvent {
  page: number
  pageSize: number
  source: TPaginationSource
}

export type TPaginationItem = number | 'ellipsis'

export interface TToolbarChangeEvent {
  search: string
  filters: Record<string, string | null>
  action?: { type: 'refresh' }
}

export interface TFilterOption {
  value: string
  label: string
}

export interface TFilterConfig {
  name: string
  allLabel: string
  options: readonly TFilterOption[]
  ariaLabel?: string
  className?: string
}

export interface TBulkAction {
  id: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
}
