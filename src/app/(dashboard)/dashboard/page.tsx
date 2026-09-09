import { PERMISSIONS } from '@/constant/permissions'
import { checkPermission, requirePermission } from '@/lib/auth/dal'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { LayoutDashboardIcon } from 'lucide-react'
import { type Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'An overview of your workspace.',
}

const DashboardPage = async () => {
  await requirePermission(PERMISSIONS.DASHBOARD_READ)
  // Without this the call to action would send a plain USER straight into a
  // 403 — a dead end is worse than no button.
  const canManageUsers = await checkPermission(PERMISSIONS.USERS_READ)

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
        description={
          canManageUsers
            ? 'Start by managing your user accounts.'
            : 'Your activity will show up here as it comes in.'
        }
        action={
          canManageUsers ? (
            <Button asChild size="sm">
              <Link href="/users">Go to Users</Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  )
}

export default DashboardPage
