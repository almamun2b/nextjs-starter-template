'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react'

interface DataTableColumnHeaderProps {
  title: string
  sorted: false | 'asc' | 'desc'
  onSort: () => void
  className?: string
}

/** Sortable column header button, driven by externally (server-side) managed sort state. */
export function DataTableColumnHeader({
  title,
  sorted,
  onSort,
  className,
}: DataTableColumnHeaderProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onSort}
      className={cn('-ml-2.5 h-8 px-2.5 text-xs font-medium', className)}
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUpIcon className="size-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDownIcon className="size-3.5" />
      ) : (
        <ChevronsUpDownIcon className="size-3.5 text-muted-foreground/50" />
      )}
    </Button>
  )
}
