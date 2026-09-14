'use client'

import { EmptyState } from '@/components/shared/empty-state'
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
    <EmptyState
      icon={AlertTriangleIcon}
      tone="destructive"
      bordered={false}
      title={title}
      description={message}
      action={
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
      }
    />
  )
}
