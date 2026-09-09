import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { LockKeyholeIcon } from 'lucide-react'
import Link from 'next/link'

/**
 * Rendered whenever `unauthorized()` is called. Next.js serves it with a 401
 * status code. Most signed-out traffic is redirected to `/login` by the proxy
 * or by `verifySession()`; this covers the cases that reach a guard directly.
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <EmptyState
        icon={LockKeyholeIcon}
        tone="destructive"
        headingTitle
        title="Please sign in"
        description="You need to be signed in to view this page."
        action={
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        }
      />
    </div>
  )
}
