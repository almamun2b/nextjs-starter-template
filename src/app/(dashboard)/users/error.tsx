'use client'

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
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-6 py-20 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangleIcon className="size-5 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || 'The users page could not be loaded.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        <RefreshCwIcon className="size-3.5" />
        Try again
      </Button>
    </div>
  )
}

export default UsersError
