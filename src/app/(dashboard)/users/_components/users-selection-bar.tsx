'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2Icon, UserCogIcon, XIcon } from 'lucide-react'

interface UsersSelectionBarProps {
  count: number
  onClear: () => void
  onBulkAction: (actionId: string) => void
}

/**
 * Floating bar — deliberately `fixed` rather than in-flow, so selecting rows
 * never pushes the table around.
 *
 * NOTE: the bulk actions are intentionally UI-only for now. The backend has no
 * bulk endpoints, so wiring these would mean fanning out one request per
 * selected user; `onBulkAction` is the single seam where that would go.
 */
export function UsersSelectionBar({
  count,
  onClear,
  onBulkAction,
}: UsersSelectionBarProps) {
  if (count === 0) return null

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-xl border bg-popover px-3 py-2 shadow-lg ring-1 ring-foreground/5"
    >
      <span className="px-1 text-sm font-medium tabular-nums">
        {count} selected
      </span>
      <Separator orientation="vertical" className="h-5" />
      <Button variant="ghost" size="sm" onClick={() => onBulkAction('status')}>
        <UserCogIcon className="size-3.5" />
        Change status
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => onBulkAction('delete')}
      >
        <Trash2Icon className="size-3.5" />
        Delete
      </Button>
      <Separator orientation="vertical" className="h-5" />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClear}
        aria-label="Clear selection"
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  )
}
