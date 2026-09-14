'use client'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'
import { useEffect } from 'react'

interface UsersErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Segment-level boundary. Catches anything the inline error state cannot —
 * e.g. a 401 rethrown by `handleFetchError` during a mutation.
 */
const UsersError = ({ error, reset }: UsersErrorProps) => {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <EmptyState
      icon={AlertTriangleIcon}
      tone="destructive"
      headingTitle
      title="Something went wrong"
      description={
        <>
          {error.message || 'The users page could not be loaded.'}
          {error.digest && (
            <span className="mt-1 block font-mono text-xs">
              Error ID: {error.digest}
            </span>
          )}
        </>
      }
      action={
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCwIcon className="size-3.5" />
          Try again
        </Button>
      }
    />
  )
}

export default UsersError
