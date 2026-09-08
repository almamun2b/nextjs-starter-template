import { ProfileView } from '@/components/modules/auth/profile-view'
import { DeactivateAccountButton } from '@/components/modules/user/deactivate-account-button'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View and manage your personal information.',
}

const ProfilePage = async () => {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your personal information.
        </p>
      </header>

      <div className="flex w-full max-w-3xl flex-col gap-6">
        <ProfileView />
        <DeactivateAccountButton />
      </div>
    </div>
  )
}

export default ProfilePage
