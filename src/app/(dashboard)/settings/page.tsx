import { EmptyState } from '@/components/shared/empty-state'
import { SettingsIcon } from 'lucide-react'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Application and workspace preferences.',
}

const SettingsPage = () => {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Application and workspace preferences.
        </p>
      </header>

      <EmptyState
        icon={SettingsIcon}
        title="Nothing to configure yet"
        description="Workspace settings will appear here once available."
        className="max-w-3xl"
      />
    </div>
  )
}

export default SettingsPage
