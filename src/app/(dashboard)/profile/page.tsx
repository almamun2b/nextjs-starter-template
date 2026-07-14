import { getMyProfile } from '@/app/actions/user'

const ProfilePage = async () => {
  const result = await getMyProfile()
  if (result.success) {
    return <div>{JSON.stringify(result.data, null, 2)}</div>
  }
  return <div>Failed</div>
}

export default ProfilePage
