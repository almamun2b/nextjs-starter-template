'use client'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { AlertTriangleIcon } from 'lucide-react'
import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <EmptyState
        icon={AlertTriangleIcon}
        tone="destructive"
        headingTitle
        title="Something went wrong!"
        description={
          <>
            {error.message || 'An unexpected error occurred.'}
            {error.digest && (
              <span className="mt-1 block font-mono text-xs">
                Error ID: {error.digest}
              </span>
            )}
          </>
        }
        action={
          <Button variant="default" onClick={() => reset()}>
            Try again
          </Button>
        }
      />
    </div>
  )
}
