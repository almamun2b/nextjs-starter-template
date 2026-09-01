'use client'

import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
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
import { type TablePaginationProps } from './types'

export function TablePagination({
  meta,
  selectedCount = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: TablePaginationProps) {
  const { page, limit, total, totalPage } = meta
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const totalPages = totalPage

  const pages = getPageNumbers(page, totalPages)

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="text-sm whitespace-nowrap text-muted-foreground">
          {selectedCount > 0 ? (
            <span className="font-medium text-foreground">
              {selectedCount} of {total} row(s) selected
            </span>
          ) : (
            <span>
              Showing {start} to {end} of {total} row(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            Rows per page:
          </span>
          <Select
            value={String(limit)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-25 text-sm">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="text-sm whitespace-nowrap text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {page === 1 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-none pl-1.5! opacity-50"
                  aria-label="Go to previous page"
                  disabled
                >
                  <ChevronLeftIcon className="size-4" />
                  <span className="hidden sm:block">Previous</span>
                </Button>
              ) : (
                <PaginationLink
                  href="#"
                  size="default"
                  className="pl-1.5!"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(page - 1)
                  }}
                >
                  <ChevronLeftIcon data-icon="inline-start" />
                  <span className="hidden sm:block">Previous</span>
                </PaginationLink>
              )}
            </PaginationItem>
            {pages.map((pageNum) => (
              <PaginationItem key={String(pageNum)}>
                {pageNum === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={pageNum === page}
                    onClick={(e) => {
                      e.preventDefault()
                      if (typeof pageNum === 'number') onPageChange(pageNum)
                    }}
                  >
                    {pageNum}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              {page === totalPages ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-none pr-1.5! opacity-50"
                  aria-label="Go to next page"
                  disabled
                >
                  <span className="hidden sm:block">Next</span>
                  <ChevronRightIcon className="size-4" />
                </Button>
              ) : (
                <PaginationLink
                  href="#"
                  size="default"
                  className="pr-1.5!"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(page + 1)
                  }}
                >
                  <span className="hidden sm:block">Next</span>
                  <ChevronRightIcon data-icon="inline-end" />
                </PaginationLink>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []
  const showFirstLast = 2
  const showAroundCurrent = 1

  pages.push(1)
  if (showFirstLast > 1) pages.push(2)

  const start = Math.max(3, currentPage - showAroundCurrent)
  const end = Math.min(totalPages - 2, currentPage + showAroundCurrent)

  if (start > showFirstLast + 1) {
    pages.push('ellipsis')
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (end < totalPages - showFirstLast) {
    pages.push('ellipsis')
  }

  if (showFirstLast > 1) pages.push(totalPages - 1)
  pages.push(totalPages)

  return pages
}
