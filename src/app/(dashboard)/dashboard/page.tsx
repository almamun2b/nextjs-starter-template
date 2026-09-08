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
          Manage product preorders efficiently — use filters, sorting, and
          pagination to stay on top of activity.
        </p>
      </header>

      <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-20 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-muted">
          <LayoutDashboardIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">No overview yet</p>
          <p className="text-sm text-muted-foreground">
            Start by managing your user accounts.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/users">Go to Users</Link>
        </Button>
      </div>
    </div>
  )
}

export default DashboardPage
