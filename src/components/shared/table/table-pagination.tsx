'use client'

import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { type TPaginationChangeEvent, type TPaginationItem } from './types'

function range(start: number, end: number): number[] {
  if (end < start) return []
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

/**
 * Builds a windowed page list such as `1 … 498 499 500 501 502 … 10000`.
 *
 * The returned array is bounded by `boundaryCount * 2 + siblingCount * 2 + 5`
 * regardless of `totalPages`, so rendering 10,000+ pages costs exactly the same
 * as rendering 10.
 */
export function getPaginationRange(
  page: number,
  totalPages: number,
  options: { siblingCount?: number; boundaryCount?: number } = {}
): TPaginationItem[] {
  const { siblingCount = 1, boundaryCount = 1 } = options

  if (totalPages <= 0) return []

  const current = Math.min(Math.max(page, 1), totalPages)

  // Boundaries + both ellipses + the sibling window + the current page.
  const totalSlots = boundaryCount * 2 + siblingCount * 2 + 3

  if (totalPages <= totalSlots + 2) {
    return range(1, totalPages)
  }

  const startPages = range(1, boundaryCount)
  const endPages = range(totalPages - boundaryCount + 1, totalPages)

  const siblingsStart = Math.max(
    Math.min(
      current - siblingCount,
      totalPages - boundaryCount - siblingCount * 2 - 1
    ),
    boundaryCount + 2
  )
  const siblingsEnd = Math.min(
    Math.max(current + siblingCount, boundaryCount + siblingCount * 2 + 2),
    totalPages - boundaryCount - 1
  )

  const items: TPaginationItem[] = [...startPages]

  if (siblingsStart > boundaryCount + 2) {
    items.push('ellipsis')
  } else if (boundaryCount + 1 < totalPages - boundaryCount) {
    items.push(boundaryCount + 1)
  }

  items.push(...range(siblingsStart, siblingsEnd))

  if (siblingsEnd < totalPages - boundaryCount - 1) {
    items.push('ellipsis')
  } else if (totalPages - boundaryCount > boundaryCount) {
    items.push(totalPages - boundaryCount)
  }

  items.push(...endPages)

  return items
}

export interface DataTablePaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onChange: (event: TPaginationChangeEvent) => void
  pageSizeOptions?: readonly number[]
  disabled?: boolean
  className?: string
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onChange,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
  className,
}: DataTablePaginationProps) {
  // Always rendered — including when empty — so results changing never
  // collapses this bar and shifts the page.
  const safeTotalPages = Math.max(totalPages, 1)
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = total === 0 ? 0 : Math.min(page * pageSize, total)
  const items = getPaginationRange(page, safeTotalPages)

  const goTo = (nextPage: number, source: TPaginationChangeEvent['source']) => {
    onChange({ page: nextPage, pageSize, source })
  }

  return (
    <div
      className={cn(
        'flex h-auto flex-col gap-3 border-t px-4 py-3 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:py-0',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <p
          className="text-sm whitespace-nowrap text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          Showing {first}–{last} of {total}
        </p>
        <Select
          value={String(pageSize)}
          disabled={disabled}
          onValueChange={(value) =>
            onChange({ page: 1, pageSize: Number(value), source: 'page-size' })
          }
        >
          <SelectTrigger
            size="sm"
            className="w-auto"
            aria-label="Rows per page"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled || page <= 1}
              onClick={() => goTo(page - 1, 'prev')}
              aria-label="Go to previous page"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
          </PaginationItem>

          {items.map((item, index) =>
            item === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis className="size-7" />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <Button
                  type="button"
                  variant={item === page ? 'outline' : 'ghost'}
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => goTo(item, 'page')}
                  aria-label={`Go to page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                  className="tabular-nums"
                >
                  {item}
                </Button>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled || page >= safeTotalPages}
              onClick={() => goTo(page + 1, 'next')}
              aria-label="Go to next page"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
