import { me } from '@/app/actions/user'
import { LogoutButton } from '@/components/modules/auth/logout-button'

const ProfilePage = async () => {
  const result = await me()

  if (result && result?.data) {
    return (
      <div className="space-y-4">
        <LogoutButton />
        <pre>{JSON.stringify(result.data, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LogoutButton />
      <div>Failed</div>
    </div>
  )
}

export default ProfilePage
