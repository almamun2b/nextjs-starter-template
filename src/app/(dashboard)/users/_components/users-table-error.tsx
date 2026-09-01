'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'
import { useUsersParams } from '../_lib/users-params-context'

interface UsersTableErrorProps {
  title: string
  message: string
}

/**
 * Inline failure state. Rendered *inside* the table card so the toolbar above
 * stays usable — the user can adjust filters or retry without a dead page.
 */
export function UsersTableError({ title, message }: UsersTableErrorProps) {
  const { isPending, refresh } = useUsersParams()

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangleIcon className="size-5 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={isPending}
      >
        <RefreshCwIcon
          className={isPending ? 'size-3.5 animate-spin' : 'size-3.5'}
        />
        Try again
      </Button>
    </div>
  )
}
