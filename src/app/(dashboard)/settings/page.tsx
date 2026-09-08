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

      <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-20 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-muted">
          <SettingsIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            Nothing to configure yet
          </p>
          <p className="text-sm text-muted-foreground">
            Workspace settings will appear here once available.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
