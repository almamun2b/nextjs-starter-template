import { ProfileEditForm } from '@/components/modules/auth/profile-edit-form'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit profile',
  description: 'Update your personal information.',
}

const ProfileEditPage = async () => {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your personal information.
        </p>
      </header>

      <div className="w-full max-w-3xl">
        <ProfileEditForm />
      </div>
    </div>
  )
}

export default ProfileEditPage
