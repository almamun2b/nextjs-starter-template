import { me } from '@/app/actions/user'
import { DeactivateAccountButton } from '@/components/modules/user/deactivate-account-button'
import { ProfileView } from '@/components/modules/auth/profile-view'

const ProfilePage = async () => {
  // Called from a Server Component (read-only cookie context), `me()` can
  // throw a 401 when the access token is expired — surface the fallback UI
  // instead of crashing the render.
  const result = await me().catch(() => null)

  if (result?.success && result.data) {
    return (
      <div className="space-y-6">
        <ProfileView user={result.data} />
        <DeactivateAccountButton />
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
