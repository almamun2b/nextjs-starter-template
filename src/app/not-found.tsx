import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { CompassIcon } from 'lucide-react'
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <EmptyState
        icon={CompassIcon}
        tone="destructive"
        headingTitle
        title="Page not found"
        description="Sorry, we couldn’t find the page you’re looking for."
        action={
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        }
      />
    </div>
  )
}
