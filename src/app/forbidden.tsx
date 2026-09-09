import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { ShieldAlertIcon } from 'lucide-react'
import Link from 'next/link'

/**
 * Rendered whenever `forbidden()` is called — by a page guard, a Server
 * Action guard, or the proxy's rewrite to `/403`. Next.js serves it with a
 * real 403 status code.
 */
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <EmptyState
        icon={ShieldAlertIcon}
        tone="destructive"
        headingTitle
        title="You don’t have access to this"
        description="Your account doesn’t have permission to view this page. If you think that’s a mistake, ask an administrator to review your role."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
