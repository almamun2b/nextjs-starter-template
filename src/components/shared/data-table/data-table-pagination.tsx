'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { IMeta } from '@/types/response.types'

const LIMIT_OPTIONS = [10, 20, 50, 100]

interface DataTablePaginationProps {
  meta: IMeta
  getPageHref: (page: number) => string
  onLimitChange: (limit: number) => void
}

function getPageNumbers(
  current: number,
  total: number
): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)

  const result: (number | 'ellipsis')[] = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push('ellipsis')
    }
    result.push(page)
  })
  return result
}

export function DataTablePagination({
  meta,
  getPageHref,
  onLimitChange,
}: DataTablePaginationProps) {
  const { page, limit, total, totalPage } = meta
  const pageNumbers = getPageNumbers(page, Math.max(totalPage, 1))

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select
          value={String(limit)}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger size="sm" className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden sm:inline">· {total} total</span>
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={getPageHref(Math.max(page - 1, 1))}
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
              className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {pageNumbers.map((pageNumber, index) =>
            pageNumber === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href={getPageHref(pageNumber)}
                  isActive={pageNumber === page}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href={getPageHref(Math.min(page + 1, totalPage || 1))}
              aria-disabled={page >= totalPage}
              tabIndex={page >= totalPage ? -1 : undefined}
              className={
                page >= totalPage ? 'pointer-events-none opacity-50' : ''
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
