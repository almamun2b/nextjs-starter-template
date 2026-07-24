import { me } from '@/app/actions/user'
import { ProfileForm } from '@/components/modules/auth/profile-form'

const ProfilePage = async () => {
  const result = await me()

  if (result.success && result.data) {
    return (
      <div className="space-y-6">
        <ProfileForm user={result.data} />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
      Failed to load profile. Please try again later.
    </div>
  )
}

export default ProfilePage
