import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { LayoutDashboardIcon } from 'lucide-react'
import { type Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'An overview of your workspace.',
}

const DashboardPage = () => {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-sm text-muted-foreground">
          This is your workspace overview — it will fill in as activity comes
          in.
        </p>
      </header>

      <EmptyState
        icon={LayoutDashboardIcon}
        title="No overview yet"
        description="Start by managing your user accounts."
        action={
          <Button asChild size="sm">
            <Link href="/users">Go to Users</Link>
          </Button>
        }
      />
    </div>
  )
}

export default DashboardPage
