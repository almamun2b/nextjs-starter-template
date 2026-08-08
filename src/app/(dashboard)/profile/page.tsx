import { ProfileView } from '@/components/modules/auth/profile-view'
import { DeactivateAccountButton } from '@/components/modules/user/deactivate-account-button'

const ProfilePage = async () => {
  return (
    <div className="space-y-6">
      <ProfileView />
      <DeactivateAccountButton />
    </div>
  )
}

export default ProfilePage
